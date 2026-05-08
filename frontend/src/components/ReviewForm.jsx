import { useState } from "react";
import { submitReview } from "../api/review.api.js";

const RESPONSE_TIMES = [
  { value: "fast", label: "⚡ Fast", color: "var(--success)" },
  { value: "moderate", label: "⏱️ Moderate", color: "var(--warning)" },
  { value: "slow", label: "🐢 Slow", color: "var(--danger)" },
];

/**
 * Reusable star-rating review form.
 * Props:
 *  - teamId (required)
 *  - teamName (display only)
 *  - sosId (optional)
 *  - requestId (optional)
 *  - onSubmitted (callback after successful submission)
 */
const ReviewForm = ({ teamId, teamName, sosId, requestId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [hoverProf, setHoverProf] = useState(0);
  const [responseTime, setResponseTime] = useState("moderate");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await submitReview({
        teamId,
        sosId: sosId || undefined,
        requestId: requestId || undefined,
        rating,
        professionalism: professionalism || rating,
        responseTime,
        comment: comment.trim(),
      });
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: 20,
        background: "var(--success-subtle)",
        borderRadius: 10,
        border: "1px solid rgba(16,185,129,0.3)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--success)" }}>Thank you for your review!</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Your feedback helps us improve rescue operations.
        </div>
      </div>
    );
  }

  const renderStars = (value, hover, setValue, setHover, label) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 24,
              padding: 2,
              transition: "transform 0.15s",
              transform: (hover || value) >= star ? "scale(1.15)" : "scale(1)",
              filter: (hover || value) >= star ? "none" : "grayscale(1) opacity(0.4)",
            }}
          >
            ⭐
          </button>
        ))}
        {(hover || value) > 0 && (
          <span style={{ fontSize: 13, color: "var(--text-2)", marginLeft: 8, alignSelf: "center" }}>
            {hover || value}/5
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      padding: 20,
      background: "var(--panel-2)",
      borderRadius: 10,
      border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>⭐</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Rate Rescue Team</div>
          {teamName && <div className="muted" style={{ fontSize: 12 }}>Team: {teamName}</div>}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {renderStars(rating, hoverRating, setRating, setHoverRating, "Overall Rating *")}
        {renderStars(professionalism, hoverProf, setProfessionalism, setHoverProf, "Professionalism")}

        {/* Response Time */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
            Response Time
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {RESPONSE_TIMES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setResponseTime(rt.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: responseTime === rt.value
                    ? `2px solid ${rt.color}`
                    : "1px solid var(--border)",
                  background: responseTime === rt.value
                    ? `${rt.color}15`
                    : "transparent",
                  color: responseTime === rt.value ? rt.color : "var(--text-2)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
            Comment (optional)
          </div>
          <textarea
            className="textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience with the rescue team?"
            maxLength={500}
            style={{ minHeight: 70, fontSize: 13 }}
          />
          <div className="muted" style={{ fontSize: 10, textAlign: "right", marginTop: 2 }}>
            {comment.length}/500
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || rating === 0}
          style={{ width: "100%" }}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
