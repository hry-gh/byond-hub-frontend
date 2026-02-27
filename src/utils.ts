/**
 * Format round duration for display.
 * - Negative values indicate lobby countdown (seconds till round starts)
 * - Positive values > 10800 are assumed to be deciseconds
 * - Otherwise treated as seconds
 */
export const formatDuration = (duration: number): string => {
  // Negative duration = lobby countdown (seconds till round starts)
  if (duration < 0) {
    const seconds = Math.abs(duration);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Lobby ${mins}:${secs.toString().padStart(2, "0")}`;
  }
  // Heuristic: if > 10800 (3 hours in seconds), assume deciseconds
  const totalSeconds = duration > 10800 ? Math.floor(duration / 10) : duration;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format shuttle timer (seconds) as M:SS
 */
export const formatShuttleTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format relative time (e.g., "5m ago", "2h ago")
 */
export const formatRelativeTime = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Parse timestamp as UTC (API returns UTC timestamps without timezone indicator)
 */
export const parseAsUTC = (timestamp: string): Date => {
  // If timestamp doesn't have timezone info, treat as UTC
  if (!timestamp.endsWith("Z") && !timestamp.includes("+")) {
    return new Date(timestamp + "Z");
  }
  return new Date(timestamp);
};
