# Negotiation layer

**What it does.** Bilateral bargaining: open a session, exchange
offers, respond, close with an `Agreement` (or `None` on breakdown).

## Interface

```python
class Negotiation(Protocol):
    async def open(self, partner: AgentId, terms: Terms) -> NegotiationSession: ...
    async def offer(self, session: NegotiationSession, terms: Terms) -> None: ...
    async def respond(self, session: NegotiationSession) -> NegotiationResponse: ...
    async def close(self, session: NegotiationSession) -> Agreement | None: ...
```

Full definition: [`nest_core/layers/negotiation.py`](../../packages/nest-core/nest_core/layers/negotiation.py).

## Default plugin

`alternating_offers` — Rubinstein-style bargaining with a patience
discount.

Source: [`nest_plugins_reference/negotiation/alternating_offers.py`](../../packages/nest-plugins-reference/nest_plugins_reference/negotiation/alternating_offers.py).

## Additional reference plugins

`pareto` — multi-attribute bargaining over price and delivery deadline. Each
agent receives private utility weights at construction time and evaluates the
full `Terms` object without changing the `Negotiation` protocol surface.

Source: [`nest_plugins_reference/negotiation/pareto.py`](../../packages/nest-plugins-reference/nest_plugins_reference/negotiation/pareto.py).

Scenario: [`multi_attribute_market.yaml`](../../scenarios/multi_attribute_market.yaml).

Design note: [`q7_multi_attribute_negotiation.md`](../q7_multi_attribute_negotiation.md).

## Writing your own

See [`writing-a-plugin.md`](../writing-a-plugin.md). Register under
entry point group `nest.plugins.negotiation`.

Good fits to test here: multi-attribute negotiation, multi-party
negotiation, agenda-based bargaining, learning-based bidding.
