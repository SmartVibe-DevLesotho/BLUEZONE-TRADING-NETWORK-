# SmartVibe Hidden Mechanics Architecture

This directory defines the internal adapter boundary for external research and validation systems.

## Authority rule

**SmartVibe Core is the sole methodology authority.** External systems may provide evidence, diagnostics, research, risk information, or operational mechanics. They must never mutate or replace SmartVibe methodology or directly publish a SmartVibe BUY/SELL decision.

## Planned layers

- `core/` — SmartVibe methodology and structural decision logic. Protected boundary.
- `intelligence/` — market, sentiment, news, macro, correlation evidence.
- `mechanics/` — technical, swarm, structure, volatility and risk validators.
- `decision/` — evidence aggregation and the final SmartVibe authority gate.
- `memory/` — setup/outcome/research records. Memory may learn performance but cannot rewrite methodology.
- `adapters/` — replaceable interfaces for external open-source engines.

## External integrations

- TauricResearch/TradingAgents: research/debate/memory architecture reference.
- Gifted87/TradingBot: secondary technical validation reference.
- ForexTreeSwarm: market-intelligence/swarm architecture reference.
- QuantDinger: candidate only until the exact repository and license are inspected.

External repositories are not copied wholesale into the mobile application. Implementations should sit behind adapters and preserve applicable license/attribution requirements.
