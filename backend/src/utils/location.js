const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizePointLocation = (value = {}, fallback = {}) => {
  const source = value && typeof value === "object" ? value : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};

  let lat = source.lat ?? source.latitude ?? source.coordinates?.lat;
  let lng = source.lng ?? source.longitude ?? source.coordinates?.lng;

  if (Array.isArray(source.coordinates) && source.coordinates.length >= 2) {
    [lng, lat] = source.coordinates;
  }

  if (lat === undefined || lng === undefined) {
    const fallbackCoords = fallbackSource.coordinates;
    if (Array.isArray(fallbackCoords) && fallbackCoords.length >= 2) {
      [lng, lat] = fallbackCoords;
    } else {
      lat = lat ?? fallbackSource.lat ?? fallbackSource.coordinates?.lat;
      lng = lng ?? fallbackSource.lng ?? fallbackSource.coordinates?.lng;
    }
  }

  const normalizedLat = toNumber(lat, 0);
  const normalizedLng = toNumber(lng, 0);

  return {
    type: "Point",
    coordinates: [normalizedLng, normalizedLat],
    address: source.address ?? fallbackSource.address ?? "",
    city: source.city ?? fallbackSource.city ?? "",
    state: source.state ?? fallbackSource.state ?? "",
  };
};

export const extractLatLng = (location = {}) => {
  if (!location || typeof location !== "object") {
    return { lat: 0, lng: 0 };
  }

  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return {
      lng: toNumber(location.coordinates[0], 0),
      lat: toNumber(location.coordinates[1], 0),
    };
  }

  return {
    lat: toNumber(location.lat ?? location.coordinates?.lat, 0),
    lng: toNumber(location.lng ?? location.coordinates?.lng, 0),
  };
};

