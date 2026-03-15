import type { LatLng } from "@/types";

export type SavedPlace = {
  id: string;
  placeId: string;              // Google Place ID
  name: string;                 // ユーザー編集可能な表示名
  originalName: string | null;  // Google Places のオリジナル施設名（キャッシュ）
  address: string;
  position: LatLng;
  rating: number | null;
  photoUrl: string | null;      // 写真URLキャッシュ（期限切れ時に placeId から再取得）
  labelIds: string[];           // PlaceLabel.id の配列
  memo: string;                 // ユーザーメモ
  createdAt: string;
  updatedAt: string;
};
