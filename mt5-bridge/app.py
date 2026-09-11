"""Authenticated live broker bridge between SmartVibe Trading Network and MT5.

The bridge is an infrastructure adapter only. It contains no strategy logic and
has no simulated or paper-trading mode. Run it on the same host as the MT5
terminal and expose it only through a private authenticated network path.
"""
from __future__ import annotations

import os
import time
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.responses import JSONResponse

try:
    import MetaTrader5 as mt5
except ImportError:  # pragma: no cover
    mt5 = None

APP = FastAPI(title="SmartVibe Trading Network MT5 Bridge", docs_url=None, redoc_url=None)
TOKEN = os.getenv("MT5_BRIDGE_TOKEN", "").strip()
ALLOW_READ_ONLY = os.getenv("MT5_ALLOW_READ_ONLY", "false").lower() == "true"
MT5_PATH = os.getenv("MT5_PATH", "").strip() or None
MT5_LOGIN = os.getenv("MT5_LOGIN", "").strip()
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
MT5_SERVER = os.getenv("MT5_SERVER", "").strip()


def auth(authorization: str | None) -> None:
    if not TOKEN:
        raise HTTPException(503, "Bridge authentication is not configured.")
    if authorization != f"Bearer {TOKEN}":
        raise HTTPException(401, "Unauthorized.")


def require_mt5() -> Any:
    if mt5 is None:
        raise HTTPException(503, "MetaTrader 5 Python package is unavailable.")
    if not mt5.initialize(path=MT5_PATH):
        raise HTTPException(503, "MetaTrader 5 terminal initialization failed.")
    try:
        ensure_login(mt5)
    except Exception:
        mt5.shutdown()
        raise
    return mt5


def ensure_login(api: Any) -> None:
    if MT5_LOGIN:
        kwargs: dict[str, Any] = {"login": int(MT5_LOGIN), "password": MT5_PASSWORD}
        if MT5_SERVER:
            kwargs["server"] = MT5_SERVER
        if not api.login(**kwargs):
            raise HTTPException(503, "MetaTrader 5 account login failed.")


def snapshot(api: Any) -> dict[str, Any]:
    info = api.account_info()
    terminal = api.terminal_info()
    if info is None or terminal is None:
        raise HTTPException(503, "MetaTrader 5 account state unavailable.")
    return {
        "connected": True,
        "trade_allowed": bool(getattr(terminal, "trade_allowed", False) and getattr(info, "trade_allowed", False)),
        "balance": float(info.balance),
        "equity": float(info.equity),
        "leverage": int(info.leverage),
        "currency": str(info.currency),
        "login": int(info.login),
        "server": str(info.server),
        "timestamp": int(time.time()),
    }


def symbol_spec(api: Any, symbol: str) -> Any:
    info = api.symbol_info(symbol)
    if info is None:
        raise HTTPException(404, "Symbol unavailable.")
    if not api.symbol_select(symbol, True):
        raise HTTPException(409, "Symbol could not be selected.")
    return info


def assert_volume(spec: Any, volume: float) -> None:
    minimum = float(spec.volume_min)
    maximum = float(spec.volume_max)
    step = float(spec.volume_step)
    if step <= 0 or volume < minimum or volume > maximum:
        raise HTTPException(400, "Volume is outside broker limits.")
    units = round((volume - minimum) / step)
    if abs(volume - (minimum + units * step)) > max(step * 1e-6, 1e-10):
        raise HTTPException(400, "Volume does not match broker step.")


def filling_mode(api: Any, spec: Any) -> int:
    modes = int(getattr(spec, "filling_mode", 0))
    if modes & 1:
        return api.ORDER_FILLING_FOK
    if modes & 2:
        return api.ORDER_FILLING_IOC
    return api.ORDER_FILLING_RETURN


def trading_allowed(api: Any) -> None:
    info = api.account_info()
    terminal = api.terminal_info()
    if info is None or terminal is None or not info.trade_allowed or not terminal.trade_allowed:
        raise HTTPException(503, "Live trading is disabled by the MT5 account or terminal.")


def result_row(result: Any, fallback_price: float | None = None) -> dict[str, Any]:
    return {
        "retcode": int(result.retcode),
        "comment": str(result.comment),
        "ticket": int(getattr(result, "order", 0) or getattr(result, "deal", 0) or 0),
        "order": int(getattr(result, "order", 0) or 0),
        "deal": int(getattr(result, "deal", 0) or 0),
        "price": float(getattr(result, "price", 0) or fallback_price or 0),
        "request_id": int(getattr(result, "request_id", 0) or 0),
        "volume": float(getattr(result, "volume", 0) or 0),
    }


@APP.exception_handler(HTTPException)
async def http_error(_, exc: HTTPException) -> JSONResponse:
    return JSONResponse({"ok": False, "error": exc.detail}, status_code=exc.status_code)


@APP.get("/health")
def health(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        info = api.account_info()
        terminal = api.terminal_info()
        return {
            "ok": True,
            "connected": info is not None and terminal is not None,
            "trade_allowed": bool(info and terminal and info.trade_allowed and terminal.trade_allowed),
            "timestamp": int(time.time()),
        }
    finally:
        api.shutdown()


@APP.get("/account")
def account(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        return snapshot(api)
    finally:
        api.shutdown()


@APP.get("/positions")
def positions(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        rows = api.positions_get() or ()
        return [position_row(x) for x in rows]
    finally:
        api.shutdown()


@APP.get("/orders")
def orders(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        rows = api.orders_get() or ()
        return [order_row(x) for x in rows]
    finally:
        api.shutdown()


@APP.get("/symbols")
def symbols(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        rows = api.symbols_get() or ()
        return [{"name": str(x.name), "visible": bool(x.visible), "trade_mode": int(x.trade_mode)} for x in rows]
    finally:
        api.shutdown()


@APP.get("/price/{symbol}")
def price(symbol: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        symbol_spec(api, symbol)
        tick = api.symbol_info_tick(symbol)
        if tick is None or float(tick.bid) <= 0 or float(tick.ask) <= 0 or float(tick.ask) <= float(tick.bid):
            raise HTTPException(503, "Quote unavailable.")
        return {"symbol": symbol, "bid": float(tick.bid), "ask": float(tick.ask), "time": int(tick.time), "timestamp": int(time.time())}
    finally:
        api.shutdown()


@APP.get("/symbol/{symbol}")
def symbol(symbol: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        info = symbol_spec(api, symbol)
        return {
            "name": str(info.name),
            "volume_min": float(info.volume_min),
            "volume_max": float(info.volume_max),
            "volume_step": float(info.volume_step),
            "trade_tick_size": float(info.trade_tick_size),
            "trade_tick_value": float(info.trade_tick_value),
            "point": float(info.point),
            "digits": int(info.digits),
            "trade_mode": int(info.trade_mode),
            "filling_mode": int(getattr(info, "filling_mode", 0)),
        }
    finally:
        api.shutdown()


@APP.post("/order")
def order(
    symbol: str = Query(...),
    lot: float = Query(..., gt=0),
    order_type: str = Query(..., pattern="^(buy|sell)$"),
    sl: float = Query(0.0, ge=0),
    tp: float = Query(0.0, ge=0),
    comment: str = Query("SV", max_length=31),
    max_deviation_points: int = Query(20, ge=0, le=1000),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth(authorization)
    if ALLOW_READ_ONLY:
        raise HTTPException(403, "Bridge is configured read-only.")
    api = require_mt5()
    try:
        trading_allowed(api)
        spec = symbol_spec(api, symbol)
        tick = api.symbol_info_tick(symbol)
        if tick is None:
            raise HTTPException(503, "Quote unavailable.")
        if spec.trade_mode == api.SYMBOL_TRADE_MODE_DISABLED:
            raise HTTPException(409, "Symbol trading is disabled.")
        assert_volume(spec, lot)
        price_value = float(tick.ask if order_type == "buy" else tick.bid)
        order_kind = api.ORDER_TYPE_BUY if order_type == "buy" else api.ORDER_TYPE_SELL
        request: dict[str, Any] = {
            "action": api.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": lot,
            "type": order_kind,
            "price": price_value,
            "deviation": max_deviation_points,
            "magic": 260911,
            "comment": comment,
            "type_time": api.ORDER_TIME_GTC,
            "type_filling": filling_mode(api, spec),
        }
        if sl > 0:
            request["sl"] = sl
        if tp > 0:
            request["tp"] = tp
        check = api.order_check(request)
        if check is None:
            raise HTTPException(502, "Broker order validation returned no result.")
        if int(getattr(check, "retcode", -1)) != 0:
            return {"retcode": int(check.retcode), "comment": str(check.comment), "validated": False}
        result = api.order_send(request)
        if result is None:
            raise HTTPException(502, "Broker order submission returned no acknowledgement.")
        return result_row(result, price_value)
    finally:
        api.shutdown()


@APP.patch("/position/{ticket}")
def modify_position(
    ticket: int,
    sl: float | None = Query(default=None, ge=0),
    tp: float | None = Query(default=None, ge=0),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth(authorization)
    if ALLOW_READ_ONLY:
        raise HTTPException(403, "Bridge is configured read-only.")
    if sl is None and tp is None:
        raise HTTPException(400, "At least one of sl or tp is required.")
    api = require_mt5()
    try:
        trading_allowed(api)
        rows = api.positions_get(ticket=ticket) or ()
        if not rows:
            raise HTTPException(404, "Position unavailable.")
        position = rows[0]
        request = {"action": api.TRADE_ACTION_SLTP, "symbol": position.symbol, "position": ticket, "sl": float(sl if sl is not None else position.sl), "tp": float(tp if tp is not None else position.tp)}
        result = api.order_send(request)
        if result is None:
            raise HTTPException(502, "Position modification returned no acknowledgement.")
        return result_row(result)
    finally:
        api.shutdown()


@APP.delete("/order/{ticket}")
def cancel_order(ticket: int, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    if ALLOW_READ_ONLY:
        raise HTTPException(403, "Bridge is configured read-only.")
    api = require_mt5()
    try:
        trading_allowed(api)
        rows = api.orders_get(ticket=ticket) or ()
        if not rows:
            raise HTTPException(404, "Pending order unavailable.")
        pending = rows[0]
        request = {"action": api.TRADE_ACTION_REMOVE, "order": ticket, "symbol": pending.symbol}
        result = api.order_send(request)
        if result is None:
            raise HTTPException(502, "Order cancellation returned no acknowledgement.")
        return result_row(result)
    finally:
        api.shutdown()


@APP.post("/position/{ticket}/close")
def close_position(
    ticket: int,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth(authorization)
    if ALLOW_READ_ONLY:
        raise HTTPException(403, "Bridge is configured read-only.")
    api = require_mt5()
    try:
        trading_allowed(api)
        rows = api.positions_get(ticket=ticket) or ()
        if not rows:
            raise HTTPException(404, "Position unavailable.")
        position = rows[0]
        tick = api.symbol_info_tick(position.symbol)
        spec = symbol_spec(api, position.symbol)
        if tick is None:
            raise HTTPException(503, "Quote unavailable.")
        is_buy = int(position.type) == int(api.POSITION_TYPE_BUY)
        request = {
            "action": api.TRADE_ACTION_DEAL,
            "symbol": position.symbol,
            "volume": float(position.volume),
            "type": api.ORDER_TYPE_SELL if is_buy else api.ORDER_TYPE_BUY,
            "position": ticket,
            "price": float(tick.bid if is_buy else tick.ask),
            "deviation": 20,
            "magic": 260911,
            "comment": "SV:CLOSE"[:31],
            "type_time": api.ORDER_TIME_GTC,
            "type_filling": filling_mode(api, spec),
        }
        result = api.order_send(request)
        if result is None:
            raise HTTPException(502, "Position close returned no acknowledgement.")
        return result_row(result, request["price"])
    finally:
        api.shutdown()


@APP.get("/execution/{ticket}")
def execution_status(ticket: int, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        position_rows = api.positions_get(ticket=ticket) or ()
        order_rows = api.orders_get(ticket=ticket) or ()
        return {
            "ticket": ticket,
            "position": position_row(position_rows[0]) if position_rows else None,
            "order": order_row(order_rows[0]) if order_rows else None,
            "timestamp": int(time.time()),
        }
    finally:
        api.shutdown()


def position_row(x: Any) -> dict[str, Any]:
    return {"ticket": int(x.ticket), "symbol": str(x.symbol), "volume": float(x.volume), "type": int(x.type), "price_open": float(x.price_open), "sl": float(x.sl), "tp": float(x.tp), "profit": float(x.profit), "time": int(x.time)}


def order_row(x: Any) -> dict[str, Any]:
    return {"ticket": int(x.ticket), "symbol": str(x.symbol), "volume": float(x.volume_current), "type": int(x.type), "price_open": float(x.price_open), "sl": float(x.sl), "tp": float(x.tp), "time_setup": int(x.time_setup)}
