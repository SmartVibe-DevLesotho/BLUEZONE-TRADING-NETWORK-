# SmartVibe Trading Network — MT5 Live Bridge

This service is the server-side broker adapter for a real MetaTrader 5 account. It must run on the same Windows machine as the MT5 terminal because the official Python integration communicates with the local terminal.

## Configure

Set these environment variables on the bridge host only:

- `MT5_BRIDGE_TOKEN` — long random bearer token shared only with the server-side execution function.
- `MT5_PATH` — optional path to the MT5 terminal executable.
- `MT5_LOGIN` — optional account login; when omitted, the already-selected terminal account is used.
- `MT5_PASSWORD` — account password when `MT5_LOGIN` is supplied.
- `MT5_SERVER` — broker server when `MT5_LOGIN` is supplied.
- `MT5_ALLOW_READ_ONLY=true` — safety mode that disables every mutating operation.

Never put these values in Expo, GitHub source, client logs, screenshots, browser storage, or public APIs.

## Run on Windows

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:MT5_BRIDGE_TOKEN = "<secret>"
python -m uvicorn app:APP --host 127.0.0.1 --port 8787
```

Expose the bridge to the Supabase Edge Function only through a private authenticated network path or a hardened reverse proxy. Do not expose the MT5 API directly to the public internet.

## Safety contract

The bridge contains no trading strategy or methodology logic. It is an infrastructure adapter. The upstream SmartVibe execution firewall remains responsible for signal authority, risk limits, duplicate protection, entitlement, kill-switch enforcement, and the decision to submit an order.

The bridge independently enforces authentication, terminal/account trading permissions, symbol availability, volume limits, quote validity, broker-side `order_check` where applicable, and broker acknowledgement. It has no paper-trading or simulated fallback.

## Live broker capabilities

The HTTP surface maps the broker abstraction to MT5 operations:

- `GET /health` — connection and trading permission heartbeat.
- `GET /account` — account balance, equity, leverage and account identity.
- `GET /positions` — open live positions.
- `GET /orders` — live pending orders.
- `GET /symbols` — broker symbols and trade modes.
- `GET /price/{symbol}` — current bid/ask quote.
- `GET /symbol/{symbol}` — volume, tick-value, tick-size and execution constraints.
- `POST /order` — validated market-order submission.
- `PATCH /position/{ticket}` — modify live stop-loss/take-profit.
- `DELETE /order/{ticket}` — cancel a pending order.
- `POST /position/{ticket}/close` — close a live position.
- `GET /execution/{ticket}` — reconcile current order/position state after submission.

All endpoints require the bearer token. Mutating endpoints are blocked when `MT5_ALLOW_READ_ONLY=true`.

Interactive API documentation is disabled intentionally.
