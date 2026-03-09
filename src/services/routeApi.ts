import { logService } from "@/services/logService";
import { performanceMonitor } from "@/services/performanceMonitor";
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

  performanceMonitor.startTimer("computeRoutes");

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

    if (!response.ok) {
      throw new Error(`Routes API error: ${response.status}`);
    }

    const data = (await response.json()) as ComputeRoutesResponse;
    performanceMonitor.endTimer("computeRoutes");
    logService.info("API", "Routes API success", {
      routes: data.routes?.length ?? 0,
    });
    return data;
  } catch (err) {
    performanceMonitor.endTimer("computeRoutes");
    logService.error("API", "Routes API failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
