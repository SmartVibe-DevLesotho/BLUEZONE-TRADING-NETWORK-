# SmartVibe Supporting Mechanics Architecture

## Authority model

SmartVibe Trading Network is the only customer-facing product. **SmartVibe Primary Methodology** is the final trading authority.

The architecture is:

Market Data → SmartVibe Supporting Mechanics → Evidence / Confluence → SmartVibe Primary Methodology → Final Decision → Risk Engine → Live Execution Gate → Broker.

Supporting mechanics provide context and evidence only. They cannot independently create, approve, modify, or execute a trade.

No third-party methodology name is a customer-facing authority. External open-source projects are treated only as technical references or libraries; their labels and methodologies are not exposed as competing systems.

## Core supporting mechanics

The SmartVibe supporting layer includes:

- universal multi-timeframe market structure
- liquidity mapping and liquidity sweeps
- range location and premium/discount context
- trend-transition / structural-shift detection
- volatility expansion, contraction and abnormal-volatility checks
- SmartVibe 4H session-cycle timing
- SmartVibe internal time-window confluence
- order-block context
- fair-value-gap / imbalance context
- displacement detection
- support and resistance context
- price-action and candlestick recognition
- classic chart-pattern recognition
- EMA alignment context
- momentum context
- volume context when reliable volume exists
- news/event risk context
- session context
- data-quality and contradiction checks

The implementation registry is in `lib/engine/smartvibe-supporting-mechanics.ts`. All entries are explicitly marked `SUPPORTING_ONLY`.

## SmartVibe 4H session-cycle timing

The production default timezone is **SAST / UTC+2**. Session timing is configurable, but the canonical SmartVibe 4H cycle is:

| Session | Accumulation | Manipulation | Distribution |
|---|---:|---:|---:|
| Asian | 00:00–04:00 | 04:00–08:00 | 08:00–12:00 |
| London | 04:00–08:00 | 08:00–12:00 | 12:00–16:00 |
| New York | 08:00–12:00 | 12:00–16:00 | 16:00–20:00 |
| Sydney | 12:00–16:00 | 16:00–20:00 | 20:00–24:00 |

These are 4-hour analytical windows. The session windows intentionally overlap because they represent independent session-cycle context rather than one mutually exclusive market-session clock.

## Internal time-window confluence

The historical internal time-window mechanic is retained as a **supporting timing signal only**. Its canonical SAST windows are:

- 07:00–08:15
- 13:00–14:00
- 16:00–17:00

The internal implementation identifier may remain in code for compatibility, but no external UI or methodology authority is assigned to it. It can only contribute supporting evidence to SmartVibe Primary Methodology.

## Price-action and candlestick mechanics

SmartVibe can recognize bullish, bearish and neutral price-action structures, including:

### Bullish / reversal-oriented

- Bullish Engulfing
- Hammer
- Inverted Hammer
- Piercing
- Morning Star
- Three White Soldiers
- Bullish Harami

### Bearish / reversal-oriented

- Bearish Engulfing
- Shooting Star
- Hanging Man
- Dark Cloud Cover
- Evening Star
- Three Black Crows
- Bearish Harami

### Neutral/contextual

- Doji

The architecture is intentionally extensible to the complete standard candlestick-pattern family supported by the selected open-source technical-analysis implementation. A detected candle is evidence, not a trade instruction.

## Classic chart-pattern mechanics

The supporting layer includes structural recognition for:

- Double Top
- Double Bottom
- Head and Shoulders
- Inverse Head and Shoulders
- Ascending Triangle
- Descending Triangle
- Symmetrical Triangle
- Rising Wedge
- Falling Wedge
- Bull Flag
- Bear Flag
- Bull Pennant
- Bear Pennant
- Rising/Up Channel
- Falling/Down Channel

Pattern recognition must be confirmed with market structure, liquidity, timing and risk context before it can affect the SmartVibe decision.

## Institutional price-action context

The SmartVibe supporting layer may use normalized implementations of:

- Break of Structure (BOS)
- Change of Character / structural shift
- swing highs and lows
- equal highs and equal lows
- liquidity pools
- bullish and bearish order blocks
- fair value gaps / imbalances
- premium and discount zones
- displacement candles
- support and resistance
- multi-timeframe alignment

These are evidence mechanisms only. They do not become a second methodology.

## Technical context

Additional technical context may include:

- EMA 750 / EMA 200 alignment
- EMA 14 / EMA 7 short-term alignment
- RSI / momentum state
- ATR / volatility state
- volume or relative-volume context where the provider supplies trustworthy volume
- trend and momentum divergence

Technical indicators cannot override SmartVibe Primary Methodology.

## Open-source intelligence integration policy

Open-source technical-analysis research was reviewed for reusable concepts and implementation patterns. Relevant examples include TA-Lib's standard technical indicators and candlestick recognition, open-source SMC implementations covering order blocks/FVG/liquidity/structure, open-source chart-pattern detectors, and open-source MT5 analysis/bot projects. The SmartVibe implementation must use original code or compatible permissive-license dependencies rather than copying restricted source.

Useful research references include:

- TA-Lib: BSD-licensed technical-analysis and candlestick-pattern library.
- Open-source SMC implementations covering structure, liquidity, order blocks and FVG.
- Open-source chart-pattern implementations covering doubles, flags, head-and-shoulders, triangles and pennants.
- Open-source MT5 analysis projects demonstrating multi-timeframe structure, session boxes, support/resistance and news-risk context.

These sources are engineering references, not methodology authorities.

## Universal market structure mechanism

The internal market-structure mechanism is instrument-agnostic. It evaluates available Monthly, Weekly, Daily, 4H, 1H and execution-timeframe data without assuming a particular asset.

It can describe:

- macro regime and higher-timeframe structure
- trend, range, accumulation, distribution, correction and transition hypotheses
- range boundaries, midpoint and range position
- periodic liquidity levels and sweeps
- structural response and trend-transition state
- volatility expansion/contraction and abnormal volatility
- structural invalidation quality
- correction and stage probabilities
- market-data quality and contradiction state

When evidence is insufficient, the mechanism returns an insufficient/uncertain state instead of fabricating confidence.

## Evidence contract

Evidence is classified as PRIMARY, CONFIRMING, CONTEXTUAL, CONTRADICTORY or INSUFFICIENT. Contradictory high-quality evidence can block a SmartVibe setup. Evidence is never treated as a simple vote count.

## Data boundary

Provider-specific market-data structures are normalized before analysis. Timestamps are UTC internally and session presentation uses the configured SmartVibe timezone. The default session reference is SAST / UTC+2.

## Execution boundary

Only a SmartVibe-authorized execution intent can reach the broker adapter. Live execution additionally requires a valid live quote, account state, symbol specification, position limit, spread limit, structural risk validation, duplicate protection, entitlement finalization and an inactive emergency halt.

No demo, paper, simulated, or synthetic execution fallback exists.

## Licensing

External open-source libraries, APIs and infrastructure remain infrastructure/evidence sources. They are integrated through adapters or independent implementations and are not presented as SmartVibe-owned methodology. Required license notices and attribution remain in appropriate technical/legal locations.
