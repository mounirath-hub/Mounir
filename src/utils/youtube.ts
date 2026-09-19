/**
 * YouTube Utility functions for extracting video ID, building embed URLs and thumbnails
 */

export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  const trimmed = urlOrId.trim();

  // If already 11-char video ID (alphanumeric, -, _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtu.be/xxx
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Handle youtube.com/watch?v=xxx
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Handle youtube.com/embed/xxx
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Handle youtube.com/shorts/xxx
  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // Handle general regex
  const generalMatch = trimmed.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (generalMatch && generalMatch[1]) return generalMatch[1];

  return null;
}

export function getYouTubeThumbnail(videoIdOrUrl?: string): string {
  const id = extractYouTubeId(videoIdOrUrl);
  if (!id) return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoIdOrUrl?: string, autoplay: boolean = true): string | null {
  const id = extractYouTubeId(videoIdOrUrl);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;
}

export function getYouTubeWatchUrl(videoIdOrUrl?: string): string {
  const id = extractYouTubeId(videoIdOrUrl);
  if (!id) return 'https://www.youtube.com';
  return `https://www.youtube.com/watch?v=${id}`;
}
