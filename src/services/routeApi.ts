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

  return response.json() as Promise<ComputeRoutesResponse>;
}
