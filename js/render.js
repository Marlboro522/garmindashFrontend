import { renderStepsChart, renderBatteryChart } from "./charts.js";

const byId = (id) => document.getElementById(id);
const valid = (n) => typeof n === "number" && Number.isFinite(n);
const number = (n) => (valid(n) ? Math.round(n).toLocaleString() : "—");

function renderMetric(prefix, metric, unit = "") {
  const current = metric?.current,
    average = metric?.average7d;
  byId(`${prefix}-value`).textContent = number(current);
  byId(`${prefix}-average`).textContent = valid(average)
    ? `${number(average)}${unit}`
    : "—";
  const delta = byId(`${prefix}-delta`);
  if (!valid(current) || !valid(average) || average === 0) {
    delta.textContent = "—";
    return;
  }
  const difference = ((current - average) / average) * 100;
  delta.textContent = `${difference > 0 ? "+" : ""}${difference.toFixed(1)}%`;
  // Delta is neutral: a higher or lower value is not universally better.
}

export function renderDashboard(data, { demo = false } = {}) {
  const m = data.metrics || {};
  renderMetric("steps", m.steps);
  renderMetric("sleep", m.sleepScore);
  renderMetric("battery", m.bodyBattery);
  renderMetric("heart", m.restingHeartRate, " bpm");

  const stepItems = data.history?.steps7d || [];
  const batteryItems = data.history?.bodyBattery24h || [];

  // Daily step chart mean comes from the same seven data points.
  const stepVals = stepItems.map((item) => item.value).filter(valid);
  const stepMean = stepVals.length
    ? stepVals.reduce((a, b) => a + b, 0) / stepVals.length
    : null;

  // 24-hour mean comes from the corresponding chart observations.
  const batteryVals = batteryItems.map((item) => item.value).filter(valid);
  const batteryMean = batteryVals.length
    ? batteryVals.reduce((a, b) => a + b, 0) / batteryVals.length
    : null;

  byId("steps-chart-average").textContent = number(stepMean);
  byId("battery-chart-average").textContent =
    batteryMean === null ? "—" : `${number(batteryMean)} / 100`;

  renderStepsChart(byId("steps-chart"), stepItems, stepMean);
  renderBatteryChart(byId("battery-chart"), batteryItems, batteryMean);

  const date = data.updatedAt ? new Date(data.updatedAt) : null;
  byId("updated-at").textContent =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Not available";

  byId("status-dot").className = "status-dot online";
  byId("status-text").textContent = demo ? "DEMO DATA" : "API CONNECTED";
  byId("data-note").textContent = demo
    ? "Showing illustrative values. Not live telemetry."
    : "Data loaded from telemetry API.";
}

export function renderError(error) {
  byId("status-dot").className = "status-dot error";
  byId("status-text").textContent = "DATA UNAVAILABLE";
  byId("data-note").textContent = error.message;
  console.error("Dashboard error:", error);
}
