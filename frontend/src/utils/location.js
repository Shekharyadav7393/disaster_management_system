export const extractLatLng = (location = {}) => {
  if (!location || typeof location !== "object") {
    return { lat: null, lng: null };
  }

  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return {
      lng: Number(location.coordinates[0]),
      lat: Number(location.coordinates[1]),
    };
  }

  if (
    location.coordinates &&
    typeof location.coordinates === "object" &&
    !Array.isArray(location.coordinates)
  ) {
    return {
      lat: Number(location.coordinates.lat),
      lng: Number(location.coordinates.lng),
    };
  }

  return {
    lat: Number(location.lat ?? location.latitude),
    lng: Number(location.lng ?? location.longitude),
  };
};

