const StatsCard = ({ label, value, icon, color = "var(--primary)", change }) => {
  const displayValue = value !== undefined && value !== null ? value : "—";

  return (
    <div className="stat-card" style={{ "--accent-color": color }}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value" style={{ color }}>{displayValue}</div>
      <div className="stat-label">{label}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  );
};

export default StatsCard;
