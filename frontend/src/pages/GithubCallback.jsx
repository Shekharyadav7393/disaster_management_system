import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRedirectPath } from "../utils/authUtils.js";

const GithubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { externalLogin } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      externalLogin("github", { code }).then((result) => {
        if (result.ok) {
          navigate(getRedirectPath(result.user?.role), { replace: true });
        } else {
          navigate("/login?error=github_failed", { replace: true });
        }
      });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, externalLogin]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "white" }}>
      <h2>Authenticating with GitHub...</h2>
    </div>
  );
};

export default GithubCallback;
