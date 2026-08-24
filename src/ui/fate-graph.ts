import { append, element } from "./dom";

export type GraphEdgeKind =
  | "causal"
  | "support"
  | "tension"
  | "conflict"
  | "open";

export interface GraphViewNode {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly column: number;
  readonly axisId?: string;
  readonly kind?: "option" | "junction";
}

export interface GraphViewEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly kind: GraphEdgeKind;
  readonly label: string;
  readonly directed?: boolean;
}

export interface GraphViewData {
  readonly columns: readonly string[];
  readonly nodes: readonly GraphViewNode[];
  readonly edges: readonly GraphViewEdge[];
  readonly emptyText: string;
  readonly onNodeSelect: (axisId: string) => void;
}

export interface GraphViewHandle {
  readonly root: HTMLElement;
  dispose(): void;
  redraw(): void;
}

function pathFor(
  source: DOMRect,
  target: DOMRect,
  host: DOMRect,
): string {
  const startX = source.right - host.left;
  const startY = source.top + source.height / 2 - host.top;
  const endX = target.left - host.left;
  const endY = target.top + target.height / 2 - host.top;
  const distance = Math.max(28, Math.abs(endX - startX) * 0.48);
  return `M ${startX} ${startY} C ${startX + distance} ${startY}, ${endX - distance} ${endY}, ${endX} ${endY}`;
}

function drawEdges(
  host: HTMLElement,
  svg: SVGSVGElement,
  edges: readonly GraphViewEdge[],
): void {
  const hostRect = host.getBoundingClientRect();
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${host.scrollWidth} ${host.scrollHeight}`);
  svg.setAttribute("width", String(host.scrollWidth));
  svg.setAttribute("height", String(host.scrollHeight));

  const definitions = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "defs",
  );
  for (const kind of ["causal", "support", "tension", "conflict", "open"] as const) {
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker.id = `arrow-${kind}`;
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto-start-reverse");
    const arrow = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrow.setAttribute("class", `graph-arrow graph-arrow--${kind}`);
    marker.append(arrow);
    definitions.append(marker);
  }
  svg.append(definitions);

  for (const edge of edges) {
    const source = host.querySelector<HTMLElement>(
      `[data-graph-node="${CSS.escape(edge.source)}"]`,
    );
    const target = host.querySelector<HTMLElement>(
      `[data-graph-node="${CSS.escape(edge.target)}"]`,
    );
    if (!source || !target) continue;

    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute("d", pathFor(source.getBoundingClientRect(), target.getBoundingClientRect(), hostRect));
    path.setAttribute("class", `graph-edge graph-edge--${edge.kind}`);
    if (edge.kind === "causal" && edge.directed !== false) {
      path.setAttribute("marker-end", `url(#arrow-${edge.kind})`);
    }
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = edge.label;
    path.append(title);
    svg.append(path);
  }
}

export function createFateGraph(data: GraphViewData): GraphViewHandle {
  const root = element("div", "fate-graph-view");
  if (data.nodes.length === 0) {
    root.append(element("p", "graph-empty", data.emptyText));
    return { root, dispose: () => undefined, redraw: () => undefined };
  }

  const scroller = element("div", "graph-scroller");
  const stage = element("div", "graph-stage");
  stage.style.setProperty("--graph-columns", String(data.columns.length));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "graph-lines");
  svg.setAttribute("aria-hidden", "true");

  data.columns.forEach((label, column) => {
    const lane = element("section", "graph-lane");
    lane.style.gridColumn = String(column + 1);
    const heading = element("h3", "graph-lane-title", label);
    lane.append(heading);

    for (const node of data.nodes.filter((candidate) => candidate.column === column)) {
      const control = node.kind === "junction"
        ? element("div", "graph-node graph-junction")
        : element("button", "graph-node");
      if (control instanceof HTMLButtonElement) control.type = "button";
      control.dataset.graphNode = node.id;
      control.dataset.kind = node.kind ?? "option";
      control.setAttribute("aria-label", `${node.code} ${node.label}`);
      if (node.axisId) {
        control.addEventListener("click", () => data.onNodeSelect(node.axisId as string));
      } else {
        control.setAttribute("role", "img");
      }
      append(
        control,
        element("span", "graph-node-code", node.code),
        element("span", "graph-node-label", node.label),
      );
      lane.append(control);
    }
    stage.append(lane);
  });

  stage.prepend(svg);
  scroller.append(stage);
  root.append(scroller);

  let frame = 0;
  const redraw = (): void => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => drawEdges(stage, svg, data.edges));
  };
  const resizeObserver = new ResizeObserver(redraw);
  resizeObserver.observe(stage);
  scroller.addEventListener("scroll", redraw, { passive: true });
  redraw();

  return {
    root,
    redraw,
    dispose: () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", redraw);
    },
  };
}
