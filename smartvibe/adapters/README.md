# External engine adapters

Adapters are intentionally evidence-only. They must:

1. Receive a read-only `SmartVibeSetup` snapshot.
2. Return structured `Evidence`.
3. Never mutate SmartVibe methodology files.
4. Never replace the setup direction.
5. Never write directly to execution.
6. Record source/version/timestamp information for auditability.

Planned adapters:

- `trading-agents` — research/debate evidence.
- `forex-tree-swarm` — market intelligence evidence.
- `trading-bot` — technical structure evidence.
- `quantdinger` — disabled until repository/license/security review is complete.
