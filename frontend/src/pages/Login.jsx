import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // ✅ Bootstrap Icons
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function doLogin(e) {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rememberMe }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } else {
      alert(data.msg || "Login failed");
    }
  }

  function handleSSOLogin() {
    window.location.href = "http://localhost:5000/api/auth/sso/login";
  }

  return (
    <div className="login-page d-flex justify-content-center align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-lg border-0 rounded-3 p-4">
              <div className="login-icon mb-3">
  <i className="bi bi-person-circle"></i>
</div>

              <form onSubmit={doLogin}>
                {/* Username field with icon inside */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <i className="bi bi-person input-icon"></i>
                </div>

                {/* Password field with eye icon */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control ps-5 pe-5"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i className="bi bi-lock input-icon"></i>
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} password-eye`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                {/* Remember me + Forgot password */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a href="/forgot-password" className="text-decoration-none">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-lg mb-3">
                  Login
                </button>
              </form>

              <div className="text-center my-3 text-muted">or continue with</div>

              <button
                onClick={handleSSOLogin}
                className="btn btn-outline-dark w-100 btn-lg"
              >
                <i className="bi bi-microsoft me-2"></i> Login with SSO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
