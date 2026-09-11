"""Hardened HTTP bridge between SmartVibe Trading Network and a local MT5 terminal.

This service must run on the same Windows host as the MetaTrader 5 terminal.
It never implements trading strategy logic; it exposes broker state and order
operations only. Authentication is mandatory when MT5_BRIDGE_TOKEN is set.
"""
from __future__ import annotations

import os
import time
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.responses import JSONResponse

try:
    import MetaTrader5 as mt5
except ImportError:  # pragma: no cover - exercised only when the host is misconfigured
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


@APP.exception_handler(HTTPException)
async def http_error(_, exc: HTTPException) -> JSONResponse:
    return JSONResponse({"ok": False, "error": exc.detail}, status_code=exc.status_code)


@APP.get("/health")
def health(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
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
        ensure_login(api)
        return snapshot(api)
    finally:
        api.shutdown()


@APP.get("/positions")
def positions(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
        rows = api.positions_get() or ()
        return [position_row(x) for x in rows]
    finally:
        api.shutdown()


@APP.get("/orders")
def orders(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
        rows = api.orders_get() or ()
        return [order_row(x) for x in rows]
    finally:
        api.shutdown()


@APP.get("/symbols")
def symbols(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
        rows = api.symbols_get() or ()
        return [{"name": str(x.name), "visible": bool(x.visible), "trade_mode": int(x.trade_mode)} for x in rows]
    finally:
        api.shutdown()


@APP.get("/price/{symbol}")
def price(symbol: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
        if not api.symbol_select(symbol, True):
            raise HTTPException(404, "Symbol unavailable.")
        tick = api.symbol_info_tick(symbol)
        if tick is None:
            raise HTTPException(503, "Quote unavailable.")
        return {"symbol": symbol, "bid": float(tick.bid), "ask": float(tick.ask), "time": int(tick.time), "timestamp": int(time.time())}
    finally:
        api.shutdown()


@APP.get("/symbol/{symbol}")
def symbol(symbol: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    auth(authorization)
    api = require_mt5()
    try:
        ensure_login(api)
        info = api.symbol_info(symbol)
        if info is None:
            raise HTTPException(404, "Symbol unavailable.")
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
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth(authorization)
    if ALLOW_READ_ONLY:
        raise HTTPException(403, "Bridge is configured read-only.")
    api = require_mt5()
    try:
        ensure_login(api)
        info = api.account_info()
        terminal = api.terminal_info()
        if info is None or terminal is None or not info.trade_allowed or not terminal.trade_allowed:
            raise HTTPException(503, "Live trading is disabled by the MT5 account or terminal.")
        spec = api.symbol_info(symbol)
        tick = api.symbol_info_tick(symbol)
        if spec is None or tick is None:
            raise HTTPException(404, "Symbol or quote unavailable.")
        if spec.trade_mode == api.SYMBOL_TRADE_MODE_DISABLED:
            raise HTTPException(409, "Symbol trading is disabled.")
        step = float(spec.volume_step)
        minimum = float(spec.volume_min)
        maximum = float(spec.volume_max)
        if lot < minimum or lot > maximum or step <= 0:
            raise HTTPException(400, "Volume is outside broker limits.")
        units = round((lot - minimum) / step)
        if abs(lot - (minimum + units * step)) > max(step * 1e-6, 1e-10):
            raise HTTPException(400, "Volume does not match broker step.")
        order_kind = api.ORDER_TYPE_BUY if order_type == "buy" else api.ORDER_TYPE_SELL
        request: dict[str, Any] = {
            "action": api.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": lot,
            "type": order_kind,
            "price": float(tick.ask if order_type == "buy" else tick.bid),
            "deviation": 20,
            "magic": 260911,
            "comment": comment,
            "type_time": api.ORDER_TIME_GTC,
            "type_filling": api.ORDER_FILLING_IOC,
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
        return {
            "retcode": int(result.retcode),
            "comment": str(result.comment),
            "ticket": int(result.order or result.deal or 0),
            "order": int(result.order or 0),
            "deal": int(result.deal or 0),
            "price": float(result.price or request["price"]),
        }
    finally:
        api.shutdown()


def position_row(x: Any) -> dict[str, Any]:
    return {"ticket": int(x.ticket), "symbol": str(x.symbol), "volume": float(x.volume), "type": int(x.type), "price_open": float(x.price_open), "sl": float(x.sl), "tp": float(x.tp), "profit": float(x.profit), "time": int(x.time)}


def order_row(x: Any) -> dict[str, Any]:
    return {"ticket": int(x.ticket), "symbol": str(x.symbol), "volume": float(x.volume_current), "type": int(x.type), "price_open": float(x.price_open), "sl": float(x.sl), "tp": float(x.tp), "time_setup": int(x.time_setup)}
