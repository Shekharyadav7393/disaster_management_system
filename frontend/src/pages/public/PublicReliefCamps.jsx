import { useCallback, useEffect, useState } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";
import LeafletMap from "../../components/LeafletMap.jsx";

const PublicReliefCamps = () => {
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/relief-camps");
      setCamps(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load relief camps.");
    } finally { }
  }, []);

  useEffect(() => {
    load();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        // Proactively center map on load if location available
      });
    }
  }, [load]);

  const handleFindNearest = async () => {
    if (!userLocation) {
        alert("Please enable location access to find the nearest camp.");
        return;
    }
    setError("");
    try {
        const { data } = await api.get(`/relief-camps/nearest?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100000`);
        if (data && data.length > 0) {
            // Highlight the first one (nearest)
            const nearest = data[0];
            alert(`Found nearest camp: ${nearest.name}`);
            // Small hack to center map by updating center prop or just letting markers handle it
        } else {
            alert("No relief camps found within 100km.");
        }
    } catch (err) {
        setError("Failed to find nearest camps.");
    }
  };

  const mapMarkers = camps.map(c => ({
    lat: c.location?.coordinates[1],
    lng: c.location?.coordinates[0],
    type: "camp",
    title: c.name,
    description: `Status: ${c.status} | Beds: ${c.bedsAvailable}/${c.capacity} | Food: ${c.foodSupply}`,
    severity: c.status === "ACTIVE" ? "low" : c.status === "FULL" ? "warning" : "high",
  })).filter(m => m.lat && m.lng);

  return (
    <PublicLayout>
      {error && <div className="card">{error}</div>}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 15 }}>
          <div>
            <h3 style={{ margin: 0 }}>Nearby Relief Camps</h3>
            <p className="muted" style={{ margin: "5px 0 0 0" }}>Find the nearest active relief camp on the map.</p>
          </div>
          <button className="btn btn-primary" onClick={handleFindNearest} disabled={!userLocation}>
            📍 Find Nearest Relief Camp
          </button>
        </div>
        <div style={{ marginTop: 15 }}>
          <LeafletMap
            height={450}
            markers={mapMarkers}
            userLocation={userLocation}
            zoom={userLocation ? 10 : 5}
            center={userLocation ? [userLocation.lat, userLocation.lng] : [22.5, 78.5]}
          />
        </div>
      </div>
      
      <div className="grid grid-3">
        {camps.map((c) => (
          <div key={c._id} className="card" style={{ borderTop: `4px solid ${c.status === "ACTIVE" ? "#10b981" : c.status === "FULL" ? "#f59e0b" : "#ef4444"}`}}>
            <h4 style={{ margin: "0 0 10px 0" }}>{c.name}</h4>
            <div style={{ fontSize: 13, marginBottom: 5 }}>
              Status: <span className={`badge badge-${c.status === "ACTIVE" ? "success" : c.status === "FULL" ? "warning" : "danger"}`}>{c.status}</span>
            </div>
            <div className="muted" style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 5 }}>
              <span>🛏️ Beds: {c.bedsAvailable} / {c.capacity}</span>
              <span>🍲 Food Supply: {c.foodSupply}</span>
              <span>⚕️ Medical Support: {c.medicalSupport ? "Available" : "None"}</span>
              {c.contact && (
                <span style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)"}}>
                  📞 {c.contact.phone || "N/A"} | ✉️ {c.contact.email || "N/A"}
                </span>
              )}
            </div>
          </div>
        ))}
        {!camps.length && <div className="muted">No camps available.</div>}
      </div>
    </PublicLayout>
  );
};

export default PublicReliefCamps;
