import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false); // flag to show OTP input
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("OTP sent to your email!");
      setOtpSent(true);   // show OTP input now
      setTimer(60);       // start timer
      setCanResend(false);
    } else {
      setMessage(data.msg || "Email not found");
    }
  }

  async function handleVerifyOtp() {
  if (otp.length === 6) {
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        // backend should return { reset_token: "..." }
        navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${data.reset_token}`);
      } else {
        setMessage(data.msg || "Invalid OTP, please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    }
  } else {
    setMessage("OTP must be 6 digits.");
  }
}


  async function handleResendOtp() {
    const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage("OTP resent to your email!");
      setTimer(60);   // reset timer
      setCanResend(false);
    }
  }

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0 && otpSent) {
      setCanResend(true);
    }
  }, [timer, otpSent]);

  return (
    <div className="login-page d-flex justify-content-center align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-lg border-0 rounded-3 p-4">
              <div className="login-icon mb-3">
                <i className="bi bi-envelope-fill"></i>
              </div>

              <h4 className="mb-3 text-center">Forgot Password</h4>

              {!otpSent ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3 position-relative">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control ps-5"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <i className="bi bi-envelope input-icon"></i>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3">
                    Send OTP
                  </button>
                </form>
              ) : (
                <>
                  <div className="mb-3 position-relative">
                    <label className="form-label fw-semibold">Enter OTP</label>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Enter the OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <i className="bi bi-shield-lock input-icon"></i>
                  </div>

                  <button
                    className="btn btn-success w-100 mb-3"
                    onClick={handleVerifyOtp}
                  >
                    Verify OTP
                  </button>

                  {timer > 0 ? (
                    <p className="text-center text-muted">
                      Resend OTP in <b>{timer}</b> sec
                    </p>
                  ) : (
                    <button
                      className="btn btn-link text-primary w-100"
                      onClick={handleResendOtp}
                      disabled={!canResend}
                    >
                      Resend OTP
                    </button>
                  )}
                </>
              )}

              {message && (
                <div className="text-center mb-3 text-danger fw-semibold">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
