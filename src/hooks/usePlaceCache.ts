import { useState, useEffect, useCallback } from "react";
import { fetchPlaceDetails } from "@/services/placeDetailsService";
import { usePlaceStore } from "@/stores/placeStore";

type PlaceCacheResult = {
  photoUrl: string | null;
  originalName: string | null;
  isLoading: boolean;
  refetch: () => void;
};

const memoryCache = new Map<
  string,
  { photoUrl: string | null; originalName: string | null }
>();

export function usePlaceCache(
  placeId: string,
  savedPlaceId: string,
  cachedPhotoUrl: string | null,
  cachedOriginalName: string | null,
): PlaceCacheResult {
  const updatePlace = usePlaceStore((s) => s.updatePlace);
  const [photoUrl, setPhotoUrl] = useState(cachedPhotoUrl);
  const [originalName, setOriginalName] = useState(cachedOriginalName);
  const [isLoading, setIsLoading] = useState(false);

  const doFetch = useCallback(async () => {
    if (!placeId) return;
    const cached = memoryCache.get(placeId);
    if (cached) {
      setPhotoUrl(cached.photoUrl);
      setOriginalName(cached.originalName);
      updatePlace(savedPlaceId, {
        photoUrl: cached.photoUrl ?? undefined,
        name: undefined,
      });
      return;
    }
    setIsLoading(true);
    const details = await fetchPlaceDetails(placeId);
    const entry = {
      photoUrl: details.photoUrl,
      originalName: details.name,
    };
    memoryCache.set(placeId, entry);
    setPhotoUrl(entry.photoUrl);
    setOriginalName(entry.originalName);

    const updates: Partial<{ photoUrl: string; name: string }> = {};
    if (entry.photoUrl) updates.photoUrl = entry.photoUrl;
    if (Object.keys(updates).length > 0) {
      updatePlace(savedPlaceId, updates);
    }
    setIsLoading(false);
  }, [placeId, savedPlaceId, updatePlace]);

  useEffect(() => {
    if (cachedPhotoUrl && cachedOriginalName) return;
    doFetch();
  }, [cachedPhotoUrl, cachedOriginalName, doFetch]);

  const refetch = useCallback(() => {
    memoryCache.delete(placeId);
    doFetch();
  }, [placeId, doFetch]);

  return { photoUrl, originalName, isLoading, refetch };
}
