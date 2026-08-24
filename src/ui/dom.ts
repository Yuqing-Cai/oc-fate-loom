export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function append(
  parent: ParentNode,
  ...children: Array<Node | null | undefined | false>
): void {
  for (const child of children) {
    if (child) parent.append(child);
  }
}

export function button(
  label: string,
  className: string,
  onClick: () => void,
): HTMLButtonElement {
  const node = element("button", className, label);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

export function announce(message: string): void {
  const region = document.querySelector<HTMLElement>("[data-live-region]");
  if (!region) return;
  region.textContent = "";
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function downloadText(
  filename: string,
  content: string,
  type = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
