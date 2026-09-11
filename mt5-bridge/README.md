# SmartVibe Trading Network — MT5 Live Bridge

This is the server-side broker adapter for a real MetaTrader 5 account. It must run on the same Windows machine as the MT5 terminal because the official Python integration communicates with the local terminal.

## Configure

Set these environment variables on the bridge host only:

- `MT5_BRIDGE_TOKEN` — long random bearer token shared with the server-side execution function.
- `MT5_PATH` — optional path to the MT5 terminal executable.
- `MT5_LOGIN` — optional account login; prefer an account already selected in the terminal when omitted.
- `MT5_PASSWORD` — account password when `MT5_LOGIN` is supplied.
- `MT5_SERVER` — broker server when `MT5_LOGIN` is supplied.
- `MT5_ALLOW_READ_ONLY=true` — optional safety mode that disables order submission.

Never put these values in Expo, GitHub source, client logs, screenshots, or public APIs.

## Run on Windows

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
$env:MT5_BRIDGE_TOKEN = "<secret>"
python -m uvicorn app:APP --host 127.0.0.1 --port 8787
```

Expose the bridge to the Supabase Edge Function only through a private, authenticated network path or a hardened reverse proxy. Do not expose the MT5 API directly to the public internet.

## Safety contract

The bridge does not contain SmartVibe methodology logic. It accepts broker operations only after the upstream SmartVibe execution firewall has approved an order. The bridge itself still validates authentication, terminal/account trading permissions, symbol availability, volume limits, quote availability, broker-side `order_check`, and the live `order_send` acknowledgement.

The bridge has no paper-trading or simulated fallback.

## Endpoints

- `GET /health`
- `GET /account`
- `GET /positions`
- `GET /orders`
- `GET /symbols`
- `GET /price/{symbol}`
- `GET /symbol/{symbol}`
- `POST /order`

Interactive API documentation is disabled intentionally.
