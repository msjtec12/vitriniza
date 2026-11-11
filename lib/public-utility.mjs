export function normalizeExternalUrl(value) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(candidate);
    const url = new URL(hasScheme ? candidate : `https://${candidate}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildMapsDirectionsUrl(location) {
  const hasValidCoordinates =
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    Math.abs(location.latitude || 0) <= 90 &&
    Math.abs(location.longitude || 0) <= 180 &&
    location.latitude !== 0 &&
    location.longitude !== 0;

  const destination = hasValidCoordinates
    ? `${location.latitude},${location.longitude}`
    : [
        location.address,
        location.number,
        location.neighborhood_name,
        location.city_name,
        location.state_id,
      ]
        .filter(Boolean)
        .join(', ');

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
