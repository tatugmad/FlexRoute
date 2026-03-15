import { logService } from "@/services/logService";

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

    logService.debug("PLACE_DETAILS", "取得成功", { placeId });
    return {
      name: place.displayName ?? null,
      address: place.formattedAddress ?? null,
      rating: place.rating ?? null,
      photoUrl,
    };
  } catch (err) {
    logService.warn("PLACE_DETAILS", "取得失敗", { placeId, err });
    return { name: null, address: null, rating: null, photoUrl: null };
  }
}
