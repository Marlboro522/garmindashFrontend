import { USE_MOCK_DATA, getTelemetry } from "./api.js";
import { renderDashboard, renderError } from "./render.js";

async function initialize() {
  try {
    const telemetry = await getTelemetry();
    renderDashboard(telemetry, { demo: USE_MOCK_DATA });
  } catch (error) {
    renderError(error);
  }
}

initialize();
