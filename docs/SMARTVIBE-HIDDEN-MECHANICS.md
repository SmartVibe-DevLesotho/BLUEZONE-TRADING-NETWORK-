# SmartVibe Hidden Mechanics Architecture

## Authority model

SmartVibe Core is the only strategy authority. Ezra Core, A&V, 714, CRT (SAST / UTC+2), OB/FVG, Blue Zone Laws, EMA framework and structural management remain inside the Core methodology boundary.

External systems are workers. They may return evidence, research, risk information, or operational results, but they cannot create, rewrite, or mutate SmartVibe methodology decisions.

## Adapter boundary

### Research adapters

- ForexTreeSwarm: market-intelligence evidence
- TradingBot: technical/mechanical evidence
- TradingAgents: multi-agent research, bull/bear/risk review, research memory/checkpoints
- QuantDinger: candidate only until repository, license, architecture and dependencies are inspected

### Operations adapter

AI-Trader-style infrastructure may be used for agent registration, signal lifecycle, background jobs, synchronization and execution adapters. It does not become a strategy source.

Execution receives an `ExecutionIntent` only after the SmartVibe authority gate has approved a Core-created signal.

## Evidence contract

Every worker returns structured evidence with provenance. Examples include structure alignment, liquidity, volatility, macro risk, sentiment, bull/bear strength, risk status and historical similarity.

Workers do not write to `smartvibe/core/methodology/` and do not directly publish signals.

## Authority gate

The gate evaluates the Core-created setup against the collected evidence. A setup is blocked when Core fails, blocking risk evidence exists, required structural conditions conflict, or the aggregated bear case outweighs the bull case.

The gate returns an explicit authority of `smartvibe-core` so downstream operational code cannot accidentally treat an external agent as the strategy owner.

## Licensing rule

No external repository is copied wholesale into the mobile application. Integration is through adapters. If source code is later reused, its license, notices, attribution and redistribution requirements must be reviewed and preserved.

## QuantDinger status

QuantDinger remains an integration candidate. Do not import code or dependencies until the actual upstream repository is directly accessible and its license, security posture, data sources, quantitative models, backtesting, portfolio/risk design, execution mechanisms and methodology compatibility have been reviewed.

## Product boundary

The customer-facing app exposes SmartVibe Trading Network, its methodology and appropriate user-facing explanations. Internal worker names, agent debate and provider details are implementation concerns, subject to any required legal/open-source attribution.
