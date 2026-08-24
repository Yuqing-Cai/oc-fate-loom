# Content model

The domain model treats the two participants as `roleA` and `roleB`. The bundled presentation calls them “她 / she” and “他 / he”, but those defaults never determine the internal rules. Every character has the same five dimensions: goal, stance, boundary, vulnerability, and choice.

## Five creative layers

| Layer | Axes | Purpose |
| --- | --- | --- |
| Context | shared pressure, time structure | Establish a common external problem and the clock that constrains it. |
| Two characters | five mirrored axes for each role | Give both people independent aims, limits, vulnerabilities, and decision-making authority. |
| Relationship | power distribution, bond mechanism | Separate material leverage from the way intimacy is negotiated. |
| Fate | irreducible cost, ending form | Make the ending carry earlier choices instead of treating togetherness as automatic success. |
| Prose palette | narrative palette | Record the intended syntax, temperature, and narrative distance for future generation. The offline check ignores this axis. |

Every axis is currently single-select. “Single” means *dominant story function*, not that other pressures or traits cannot exist. If a future editor permits secondary traits, they should remain distinct from the primary option used by the rule engine.

## Rules are option-level

`FATE_RULES` never declares a relationship from two axis names alone. Each rule lists exact option IDs in `whenAll` and classifies their relationship as:

- `support`: the options reinforce one another without claiming causation;
- `tension`: they can coexist, but the story must carry the pressure between them;
- `conflict`: their current definitions cannot both be true;
- `causal`: the earlier option supplies a traceable cause for the later one;
- `open`: the combination leaves an answer to future scenes or the author.

The shipped rules cover lifespan asymmetry, changing power, bodily and identity boundaries, possessive control, character-specific vulnerabilities, costs, and ending forms. Mental illness is not used as a danger or romance-intensity scale; vulnerability options describe concrete narrative constraints instead.

## Fate graph and closure

```ts
const graph = deriveFateGraph(selections);
```

The result contains:

- `nodes`: every valid selected option, in stable content order;
- `relations`: every matched rule, including conflicts;
- `edges`: stable compatibility arcs for every non-conflicting matched relation;
- `junctions`: explicit all-of gates for rules with multiple prerequisites;
- `paths`: the core route plus every activated specialized path, each with status, reasons, nodes, relations, gaps, and conflicts;
- `gaps`: unsatisfied requirements, including the activating options and any selected but unacceptable option;
- `conflicts`: matched conflict rules, kept outside the DAG;
- `closure`: one of `inactive`, `open`, `blocked`, or `closed`.

Edges are never capped for display. A UI may collapse or group them, but it must disclose the full count and allow every relation to be inspected. When `sourceCount > 1`, the individual compatibility arcs are **not** independent claims. A renderer must use the matching `junction` (or the relation's `sources`, `target`, and `prerequisiteMode: "all"`) to draw all sources merging before the target.

Selecting any narrative option activates the `story-weave` bootstrap path. A shared pressure then activates the complete workflow. Specialized choices activate separately named paths such as `lifespan-gap`, `borrowed-time`, and `possession-boundary`; these remain individually visible even after their gap is satisfied.

Filling all sixteen narrative axes is necessary for the current core workflow, but is not sufficient for closure. The prose-palette axis is excluded. The core path closes only when a backward traversal from the selected `fate.ending`, using `causal` and `support` relations, reaches all of the following as connected ancestors:

- context;
- at least one `roleA` option;
- at least one `roleB` option;
- a relationship option;
- the selected fate cost.

`tension` and `open` relations remain visible but cannot carry closure. Zero qualifying relations can never close. Global closure additionally requires every activated specialized path to be closed and every blocking conflict and gap to be resolved. A locally coherent pair, or a completely filled but disconnected form, remains open.

Special paths add semantic requirements. For example, a lifespan gap must be carried by time, memory, or separation; selecting status loss does not satisfy that path even though the cost axis is technically filled. Filling an acceptable option removes the gap, but the specialized path closes only when a matching `causal` or `support` relation also carries it. A tension-only possession/boundary combination remains open.

`closure` publishes `activePathCount`, `closedPathCount`, `openPathCount`, `blockedPathCount`, and `closedPathIds`. These fields come directly from `graph.paths`; presentation code must not recompute them as a single `0/1` path.

## Public API

The stable entry point is `src/domain/index.ts`:

```ts
import {
  AXES,
  CHAPTERS,
  DEFAULT_ROLE_PRESENTATION,
  deriveFateGraph,
  getAxis,
  getOption,
  getOptionsForAxis,
  isValidSelection,
  normalizeSelections,
} from "./domain";
```

Persist option IDs rather than array indexes. Always run restored data through `normalizeSelections`; it drops missing IDs and options stored under the wrong axis. The prose palette is excluded from closure because style cannot repair a structural conflict.
