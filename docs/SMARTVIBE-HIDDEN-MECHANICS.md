# SmartVibe Supporting Mechanisms Architecture

## Authority model

SmartVibe Trading Network is the only customer-facing product. SmartVibe Primary Methodology is the final trading authority.

The architecture is:

Market Data → Supporting Mechanisms → Evidence / Confluence → SmartVibe Primary Methodology → Final Decision → Risk Engine → Live Execution Gate → Broker.

Supporting mechanisms provide context only. They cannot create, approve, modify, or execute a trade independently.

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

Provider-specific market-data structures are normalized before analysis. Timestamps are UTC internally and session presentation uses the configured SmartVibe timezone. The default session reference is SAST / UTC+2; CRT timing remains configurable at 08:00 accumulation, 12:00 manipulation and 16:00 distribution.

## Execution boundary

Only a SmartVibe-authorized execution intent can reach the broker adapter. Live execution additionally requires a valid live quote, account state, symbol specification, position limit, spread limit, structural risk validation, duplicate protection, entitlement finalization and an inactive emergency halt.

No demo, paper, simulated, or synthetic execution fallback exists.

## Licensing

External open-source libraries, APIs and infrastructure remain infrastructure/evidence sources. They are integrated through adapters or independent implementations and are not presented as SmartVibe-owned methodology. Required license notices and attribution remain in appropriate technical/legal locations.
