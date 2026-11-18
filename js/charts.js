// Lightweight SVG charts. No charting dependency or build step.
const NS = "http://www.w3.org/2000/svg";

function el(tag, attributes = {}, content) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  if (content !== undefined) node.textContent = content;
  return node;
}

function frame(container, max, steps, unitFormat) {
  container.replaceChildren();

  const svg = el("svg", {
    viewBox: "0 0 550 255",
    role: "img",
    "aria-label": container.getAttribute("aria-label") || "Historical chart",
  });

  const plot = { left: 55, right: 535, top: 15, bottom: 222 };
  const y = (value) => plot.bottom - (value / max) * (plot.bottom - plot.top);

  for (let i = 0; i <= steps; i++) {
    const value = (max * i) / steps;
    const yy = y(value);

    svg.append(
      el("line", {
        x1: plot.left,
        x2: plot.right,
        y1: yy,
        y2: yy,
        class: "gridline",
      }),
    );

    svg.append(
      el(
        "text",
        {
          x: 45,
          y: yy + 4,
          "text-anchor": "end",
          class: "tick",
        },
        unitFormat(value),
      ),
    );
  }

  container.append(svg);
  return { svg, plot, y };
}

function empty(container) {
  container.innerHTML = '<p class="empty">No historical data available</p>';
}

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function meanLine(svg, plot, y, mean) {
  if (numeric(mean)) {
    svg.append(
      el("line", {
        x1: plot.left,
        x2: plot.right,
        y1: y(mean),
        y2: y(mean),
        class: "mean",
      }),
    );
  }
}

export function renderStepsChart(container, records, mean) {
  const items = Array.isArray(records)
    ? records.filter((item) => item && numeric(item.value))
    : [];

  if (!items.length) return empty(container);

  const maxValue = Math.max(
    ...items.map((item) => item.value),
    numeric(mean) ? mean : 0,
    1,
  );
  const max = Math.ceil(maxValue / 3000) * 3000;

  const { svg, plot, y } = frame(container, max, 4, (n) =>
    n >= 1000 ? `${n / 1000}k` : String(n),
  );

  const width = (plot.right - plot.left) / items.length;
  const barWidth = Math.min(30, width * 0.53);

  items.forEach((item, i) => {
    const x = plot.left + i * width + (width - barWidth) / 2;
    const yy = y(item.value);

    const bar = el("rect", {
      x,
      y: yy,
      width: barWidth,
      height: Math.max(0, plot.bottom - yy),
      rx: 3,
      class: `bar ${i === items.length - 1 ? "latest" : ""}`,
    });

    bar.append(
      el("title", {}, `${item.date}: ${item.value.toLocaleString()} steps`),
    );
    svg.append(bar);

    svg.append(
      el(
        "text",
        {
          x: x + barWidth / 2,
          y: 245,
          "text-anchor": "middle",
          class: "tick",
        },
        dayLabel(item.date),
      ),
    );
  });

  meanLine(svg, plot, y, mean);
}

function dayLabel(value) {
  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date
        .toLocaleDateString(undefined, {
          weekday: "short",
        })
        .toUpperCase();
}

export function renderBatteryChart(container, records, mean) {
  const items = Array.isArray(records)
    ? records.filter((item) => item && numeric(item.value))
    : [];

  if (!items.length) return empty(container);

  const { svg, plot, y } = frame(container, 100, 4, String);

  const x = (i) =>
    plot.left + (i / Math.max(items.length - 1, 1)) * (plot.right - plot.left);

  const coords = items.map((item, i) => [
    x(i),
    y(Math.max(0, Math.min(100, item.value))),
  ]);

  const path = coords
    .map(([xx, yy], i) => `${i ? "L" : "M"}${xx} ${yy}`)
    .join(" ");

  const last = coords.at(-1);

  svg.append(
    el("path", {
      d: `${path} L${last[0]} ${plot.bottom} L${coords[0][0]} ${plot.bottom} Z`,
      class: "area",
    }),
  );

  svg.append(
    el("path", {
      d: path,
      class: "series",
    }),
  );

  items.forEach((item, i) => {
    const point = el("circle", {
      cx: x(i),
      cy: y(Math.max(0, Math.min(100, item.value))),
      r: 4,
      class: "point",
      opacity: 0,
    });

    point.append(el("title", {}, `${item.time}: ${item.value}/100`));
    svg.append(point);
  });

  meanLine(svg, plot, y, mean);

  const labelIndices = [
    ...new Set([
      0,
      Math.floor((items.length - 1) / 4),
      Math.floor((items.length - 1) / 2),
      Math.floor((3 * (items.length - 1)) / 4),
      items.length - 1,
    ]),
  ];

  for (const i of labelIndices) {
    svg.append(
      el(
        "text",
        {
          x: x(i),
          y: 245,
          "text-anchor":
            i === 0 ? "start" : i === items.length - 1 ? "end" : "middle",
          class: "tick",
        },
        items[i].time,
      ),
    );
  }
}
