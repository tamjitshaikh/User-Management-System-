import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css"; // reuse your login CSS

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const email = query.get("email");
  const resetToken = query.get("token");

  async function handleReset(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reset_token: resetToken, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage(data.msg || "Password reset failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  }

  return (
    <div className="login-page d-flex justify-content-center align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-lg border-0 rounded-3 p-4">
              <div className="login-icon mb-3">
                <i className="bi bi-lock-fill"></i>
              </div>

              <h4 className="mb-3 text-center">Reset Password</h4>

              <form onSubmit={handleReset}>
                <div className="mb-3 position-relative">
                  <input
                    type="password"
                    className="form-control ps-5"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i className="bi bi-key input-icon"></i>
                </div>

                <div className="mb-3 position-relative">
                  <input
                    type="password"
                    className="form-control ps-5"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <i className="bi bi-key input-icon"></i>
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3">
                  Reset Password
                </button>
              </form>

              {message && <div className="text-center text-success">{message}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
