import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { ComputeRoutesRequest, ComputeRoutesResponse } from "@/types";

const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

const FIELD_MASK = [
  "routes.duration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.legs.steps.polyline.encodedPolyline",
  "routes.legs.steps.navigationInstruction.instructions",
].join(",");

export async function computeRoutes(
  request: ComputeRoutesRequest,
): Promise<ComputeRoutesResponse> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  const wpCount = 2 + (request.intermediates?.length ?? 0);
  const startMs = performance.now();

  try {
    const response = await fetch(ROUTES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        ...request,
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "ja-JP",
      }),
    });

    const elapsedMs = Math.round(performance.now() - startMs);

    if (!response.ok) {
      fr.error(C.API, "api.routes.httpError", {
        status: response.status, wpCount, elapsedMs,
      });
      throw new Error(`Routes API error: ${response.status}`);
    }

    const data = (await response.json()) as ComputeRoutesResponse;
    const route = data.routes?.[0];
    fr.info(C.API, "api.routes.success", {
      wpCount, elapsedMs,
      routes: data.routes?.length ?? 0,
      distanceM: route?.distanceMeters ?? 0,
      legs: route?.legs?.length ?? 0,
      steps: route?.legs?.reduce((n, l) => n + (l.steps?.length ?? 0), 0) ?? 0,
    });

    if (elapsedMs >= 5000) {
      fr.warn(C.PERF, "perf.slow", { label: "computeRoutes", elapsed: elapsedMs });
    } else {
      fr.debug(C.PERF, "perf.timer", { label: "computeRoutes", elapsed: elapsedMs });
    }

    return data;
  } catch (err) {
    const elapsedMs = Math.round(performance.now() - startMs);
    fr.error(C.API, "api.routes.failed", {
      error: err instanceof Error ? err.message : String(err),
      wpCount, elapsedMs,
    });
    throw err;
  }
}
