import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const ReportIncidentModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleContinue = () => {
    onClose?.();
    onSuccess?.();
    navigate(user ? "/report-disaster" : "/login");
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          Report incident
        </div>
        <p style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
          Incident reports support photos, video, GPS location, and admin verification. Continue to the full reporting flow to submit evidence safely.
        </p>
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            fontSize: 13,
            color: "var(--text-2)",
          }}
        >
          {user
            ? "You are signed in, so the report will be linked to your account."
            : "You need to sign in first so responders can contact you and verify the report."}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button className="btn" onClick={() => onClose?.()}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleContinue}>
            {user ? "Open Report Form" : "Sign In to Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
