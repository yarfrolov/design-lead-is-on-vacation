type Child = Node | string | null | undefined | false;
type AttrValue = string | number | boolean | undefined;

export function text(value: string): Text {
  return document.createTextNode(value);
}

export function el(tag: string, attrs?: Record<string, AttrValue>, ...children: Child[]): HTMLElement {
  const node = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === false) continue;
      if (key === "className") {
        node.className = String(value);
      } else if (key === "textContent") {
        node.textContent = String(value);
      } else       if (key === "htmlFor") {
        (node as HTMLLabelElement).htmlFor = String(value);
      } else if (key.startsWith("data-")) {
        node.setAttribute(key, String(value));
      } else if (key === "disabled" && value === true) {
        node.setAttribute("disabled", "");
      } else if (key === "style" && typeof value === "string") {
        node.setAttribute("style", value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === "string" ? text(child) : child);
  }

  return node;
}

export function button(
  label: string,
  attrs?: Record<string, AttrValue>,
  ...children: Child[]
): HTMLButtonElement {
  return el("button", { type: "button", textContent: label, ...attrs }, ...children) as HTMLButtonElement;
}

export function backChevronSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12.5 15L7.5 10L12.5 5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.75");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  return svg;
}

export function replaceChildren(parent: HTMLElement, ...children: Child[]): void {
  parent.replaceChildren();
  for (const child of children) {
    if (child == null || child === false) continue;
    parent.appendChild(typeof child === "string" ? text(child) : child);
  }
}
