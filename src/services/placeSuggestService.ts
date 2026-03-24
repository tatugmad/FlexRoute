import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";
import type { PlaceResult } from "@/types";

export type SuggestionEntry = {
  suggestion: google.maps.places.AutocompleteSuggestion;
  placeId: string;
  name: string;
  address: string;
};

let placesLib: google.maps.PlacesLibrary | null = null;

export async function initPlacesLib(): Promise<boolean> {
  try {
    placesLib = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
    return true;
  } catch (err) {
    fr.warn(C.PLACE_DETAILS, "search.initFailed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export function createSessionToken(): google.maps.places.AutocompleteSessionToken {
  return new placesLib!.AutocompleteSessionToken();
}

export async function fetchSuggestions(
  input: string,
  token: google.maps.places.AutocompleteSessionToken,
): Promise<SuggestionEntry[]> {
  const { suggestions } =
    await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      includedRegionCodes: ["jp"],
      language: "ja",
      sessionToken: token,
    });
  return suggestions
    .filter((s) => s.placePrediction != null)
    .slice(0, 5)
    .map((s) => ({
      suggestion: s,
      placeId: s.placePrediction!.placeId,
      name: s.placePrediction!.text.text,
      address: s.placePrediction!.secondaryText?.text ?? "",
    }));
}

export async function resolvePlace(
  entry: SuggestionEntry,
  place: PlaceResult,
): Promise<{ name: string; position: { lat: number; lng: number } } | null> {
  try {
    const placeObj = entry.suggestion.placePrediction!.toPlace();
    await placeObj.fetchFields({ fields: ["displayName", "location"] });
    const loc = placeObj.location;
    if (!loc) {
      fr.warn(C.PLACE_DETAILS, "search.detailFailed", { placeId: place.placeId });
      return null;
    }
    const name = placeObj.displayName ?? place.name;
    const position = { lat: loc.lat(), lng: loc.lng() };
    fr.info(C.UI, "search.selectPlace", { placeId: place.placeId, name, position });
    return { name, position };
  } catch (err) {
    fr.warn(C.PLACE_DETAILS, "search.detailFailed", {
      placeId: place.placeId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
