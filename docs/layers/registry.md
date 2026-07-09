# Registry layer

**What it does.** Let agents publish an `AgentCard` describing
themselves and discover other agents by `Query`.

## Interface

```python
class Registry(Protocol):
    async def register(self, card: AgentCard) -> None: ...
    async def lookup(self, query: Query) -> list[AgentCard]: ...
    async def subscribe(self, query: Query) -> AsyncIterator[AgentCard]: ...
    async def deregister(self, agent: AgentId) -> None: ...
```

Full definition: [`nest_core/layers/registry.py`](../../packages/nest-core/nest_core/layers/registry.py).

## Default plugin

`in_memory` — dict-based; no persistence, no replication.

Source: [`nest_plugins_reference/registry/in_memory.py`](../../packages/nest-plugins-reference/nest_plugins_reference/registry/in_memory.py).

## Gossip plugin: `gossip`

`gossip` gives every agent its own local registry view and synchronizes those
views with push-pull anti-entropy over the transport layer. Lookups read only
the local view, so during a simulator network partition a peer cannot discover
cards from the other partition unless a reachable bridge agent gossips them.

Each card update is tagged with `(version, publisher_id)` and tombstones are
propagated, so stale writes cannot resurrect deregistered cards. The gossip wire
path rejects malformed payloads, negative versions, and forged pushes where one
publisher tries to overwrite another agent's card.

Source: [`nest_plugins_reference/registry/gossip.py`](../../packages/nest-plugins-reference/nest_plugins_reference/registry/gossip.py).

Scenario: [`scenarios/gossip_registry.yaml`](../../scenarios/gossip_registry.yaml)
uses 20 partitioned peers plus one bridge and validates convergence under
message loss.

## Writing your own

See [`writing-a-plugin.md`](../writing-a-plugin.md). Register under
entry point group `nest.plugins.registry`.

Good fits to test here: DHT-backed registries, gossip-based discovery,
filtering / capability queries, registry consensus protocols.
