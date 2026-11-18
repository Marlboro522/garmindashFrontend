// Set to false when your Netlify Function is ready.
export const USE_MOCK_DATA = true;

const DATA_URL = USE_MOCK_DATA
  ? "./data/sample.json"
  : "/.netlify/functions/activity";

export async function getTelemetry() {
  const response = await fetch(DATA_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Telemetry request failed: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || typeof data !== "object") {
    throw new Error("Invalid telemetry response");
  }

  return data;
}
