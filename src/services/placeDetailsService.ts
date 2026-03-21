import { flightRecorder as fr } from "@/services/flightRecorder";
import { LOG_CATEGORIES as C } from "@/types/log";

export type PlaceDetails = {
  name: string | null;
  address: string | null;
  rating: number | null;
  photoUrl: string | null;
};

export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails> {
  try {
    const { Place } = (await google.maps.importLibrary(
      "places",
    )) as google.maps.PlacesLibrary;
    const place = new Place({ id: placeId });
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "rating", "photos"],
    });

    let photoUrl: string | null = null;
    const firstPhoto = place.photos?.[0];
    if (firstPhoto) {
      photoUrl = firstPhoto.getURI({ maxWidth: 400 });
    }

    fr.debug(C.PLACE_DETAILS, "placeDetails.fetched", {
      placeId,
      hasName: place.displayName != null,
      hasRating: place.rating != null,
      hasPhoto: firstPhoto != null,
    });
    return {
      name: place.displayName ?? null,
      address: place.formattedAddress ?? null,
      rating: place.rating ?? null,
      photoUrl,
    };
  } catch (err) {
    fr.warn(C.PLACE_DETAILS, "placeDetails.failed", {
      placeId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { name: null, address: null, rating: null, photoUrl: null };
  }
}
