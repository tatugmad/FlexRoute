export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}分`;
  }

  return `${hours}時間${minutes}分`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  return `${(meters / 1000).toFixed(1)}km`;
}
