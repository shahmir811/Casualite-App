// Clamps an image's natural aspect ratio (width / height) into a range that
// keeps a feed/detail layout usable — an extreme portrait or panorama upload
// otherwise renders as a huge sliver. 4:5 / 1.91:1 mirrors Instagram's own
// feed clamp, a well-tested bound for arbitrary user-uploaded photos.
const MIN_ASPECT_RATIO = 4 / 5;
const MAX_ASPECT_RATIO = 1.91 / 1;

export function clampAspectRatio(ratio: number): number {
  return Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, ratio));
}
