# Signal Engineer

## Role
Specialist sub-agent responsible for deterministic signal synthesis and confidence calculation.

## Responsibilities
- **Signal Feature** (`src/features/signal/`):
  - Deterministic signal decision rules (`LONG`, `SHORT`, `WAIT`).
  - Strict conflict resolution: conflicting indicators/regimes resolve safely to `WAIT`.
  - Deterministic confidence engine: score combining technical consensus, regime alignment, news sentiment, and network volatility.
  - Transparent rationale builder: structured list of human-readable reasons explaining every decision.
  - Extensive unit testing of all rule permutations.

## Boundaries
- Confidence must be calculated via code formulas, never blindly trusting an AI score.
- Signals must be reproducible given the input snapshot.
