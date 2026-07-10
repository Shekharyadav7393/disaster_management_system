import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
      } catch (error) {
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h2>Email Verification</h2>
        {status === "verifying" && <p>Verifying your email... please wait.</p>}
        {status === "success" && (
          <>
            <div className="auth-alert auth-alert-success">Email verified successfully!</div>
            <Link to="/login" className="auth-submit-btn" style={{ textDecoration: "none", display: "inline-block", marginTop: "10px" }}>Go to Login</Link>
          </>
        )}
        {status === "error" && (
          <div className="auth-alert auth-alert-error">Invalid or expired token.</div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
