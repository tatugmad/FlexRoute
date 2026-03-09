import type { ComputeRoutesRequest, ComputeRoutesResponse } from "@/types";

const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

export async function computeRoutes(
  request: ComputeRoutesRequest,
): Promise<ComputeRoutesResponse> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const response = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "routes.legs.startLocation,routes.legs.endLocation,routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline,routes.distanceMeters,routes.duration,routes.polyline",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Routes API error: ${response.status}`);
  }

  return response.json() as Promise<ComputeRoutesResponse>;
}
