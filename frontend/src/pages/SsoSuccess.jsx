import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SsoSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const user = params.get("user"); // encoded JSON or base64

    console.log("SSO callback params:", { token, user });

    if (token && user) {
      try {
        localStorage.setItem("token", token);

        // decode safely
        const decodedUser = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("user", JSON.stringify(decodedUser));

        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to decode user:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return <p>Redirecting to dashboard...</p>;
}
