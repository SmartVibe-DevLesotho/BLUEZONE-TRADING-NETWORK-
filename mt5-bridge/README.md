# SmartVibe Trading Network — Cloud MT5 Live Bridge

This service is the server-side broker adapter for a real MetaTrader 5 account. It contains **no strategy logic** and has **no paper, demo, or simulated execution mode**.

## Recommended $0 architecture

Use an **Oracle Cloud Infrastructure (OCI) Always Free x86_64 VM** as the persistent MT5 node, run the Windows MT5 terminal and official Windows `MetaTrader5` Python package under Wine, bind the bridge to `127.0.0.1`, and connect it to the SmartVibe cloud through **Cloudflare Tunnel**.

```text
SmartVibe Trading Network App
          |
          v
Supabase / SmartVibe execution firewall
          |
          | authenticated HTTPS
          v
Cloudflare Tunnel (outbound only)
          |
          v
OCI Always Free x86_64 VM
  +-----------------------------+
  | MT5 terminal (Wine)         |
  | official MT5 Python API     |
  | SmartVibe FastAPI bridge    |
  +-----------------------------+
          |
          v
       Broker
```

OCI documents Always Free AMD `VM.Standard.E2.1.Micro` instances as x86 compute available for the life of the account, subject to its Always Free conditions. The MT5 Python package publishes Windows x86-64 wheels, so the cloud node must be x86_64 rather than OCI Ampere ARM. The included bootstrap adds swap and uses Wine/Xvfb so no physical computer is required.

## Important limitation

The official `MetaTrader5` Python package is published as Windows x86-64 wheels. This repository therefore does **not** pretend that native Linux Python can run the MT5 API. The cloud bootstrap installs a Windows Python runtime and MT5 terminal under Wine on an x86_64 Linux VM.

This is the free-cloud path we are standardizing on. Before enabling live automation, the actual broker terminal/account must pass the bridge health, account, quote, symbol, and execution-reconciliation checks. Cloud hosting alone does not prove broker connectivity.

## Cloud bootstrap

From the repository checkout on the OCI VM:

```bash
sudo bash mt5-bridge/cloud/oracle/bootstrap.sh
```

The bootstrap installs:

- Wine x86_64
- Xvfb for the headless MT5 terminal
- Windows Python 3.11 x86-64
- the official MetaTrader5 Python package
- MetaTrader 5 terminal
- FastAPI/Uvicorn bridge dependencies
- systemd services for automatic restart

The installer fails closed on ARM because the official MT5 Python wheel is Windows x86-64.

## Broker secrets

Create `/etc/smartvibe/mt5-bridge.env` **only on the cloud VM**:

```dotenv
MT5_BRIDGE_TOKEN=<long-random-secret>
MT5_LOGIN=<broker-account-login>
MT5_PASSWORD=<broker-account-password>
MT5_SERVER=<broker-server-name>
MT5_PATH=/opt/smartvibe/mt5-bridge/terminal/terminal64.exe
MT5_ALLOW_READ_ONLY=true
```

Never put these values in Expo, GitHub, browser storage, client logs, screenshots, or public APIs.

Keep `MT5_ALLOW_READ_ONLY=true` until the complete connectivity test passes. Change it to `false` only when live trading is deliberately activated through the SmartVibe execution controls.

## Services

```bash
sudo systemctl enable --now smartvibe-mt5-terminal
sudo systemctl enable --now smartvibe-mt5-bridge
sudo systemctl status smartvibe-mt5-terminal smartvibe-mt5-bridge
```

The bridge listens only on `127.0.0.1:8787` by default. Do **not** open port 8787 in the OCI security list.

Local health check:

```bash
curl -H 'Authorization: Bearer <MT5_BRIDGE_TOKEN>' http://127.0.0.1:8787/health
```

Expected successful state includes `ok: true` and `connected: true`. Live trading additionally requires `trade_allowed: true`.

## Cloudflare Tunnel

Install `cloudflared` on the same VM and create a named tunnel in the Cloudflare dashboard that routes a hostname such as `mt5.your-domain.example` to:

```text
http://127.0.0.1:8787
```

Run the tunnel as a system service using the tunnel token. Cloudflare Tunnel is preferable to exposing the bridge port because the connector establishes an outbound-only connection and the origin does not need an inbound public port.

The SmartVibe server still sends the bridge bearer token. Cloudflare Tunnel is the network path; it is not a replacement for bridge authentication.

For stronger defense-in-depth, Cloudflare Access service-token authentication can also be placed in front of the hostname. The bridge token remains mandatory at the origin.

## Live safety contract

The bridge independently enforces:

- bearer authentication
- terminal/account trading permission
- read-only safety mode
- symbol availability
- broker volume min/max/step
- quote validity
- broker `order_check`
- broker acknowledgement
- execution reconciliation

The upstream SmartVibe execution firewall remains responsible for methodology authority, supporting-mechanism validation, risk limits, duplicate protection, entitlement, kill switch, exposure limits, and the decision to submit an order.

There is no paper-trading or simulated fallback.

## Live broker capabilities

- `GET /health` — connection and trading permission heartbeat
- `GET /account` — balance, equity, leverage and account identity
- `GET /positions` — open live positions
- `GET /orders` — live pending orders
- `GET /symbols` — broker symbols and trade modes
- `GET /price/{symbol}` — current bid/ask quote
- `GET /symbol/{symbol}` — volume/tick/execution constraints
- `POST /order` — validated market-order submission
- `PATCH /position/{ticket}` — modify live stop-loss/take-profit
- `DELETE /order/{ticket}` — cancel a pending order
- `POST /position/{ticket}/close` — close a live position
- `GET /execution/{ticket}` — reconcile current order/position state

Interactive API documentation is intentionally disabled.
