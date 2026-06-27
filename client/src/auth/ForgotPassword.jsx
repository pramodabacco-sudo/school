// src/auth/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [phone, setPhone]         = useState("");
  const [message, setMessage]     = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [method, setMethod]       = useState("sms"); // "sms" | "email"
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setMessage("Please enter your mobile number");
      setIsSuccess(false);
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setMessage("Please enter a valid 10-digit mobile number");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        phone,
        method, // "sms" or "email"
      });

      setMessage(res.data.message);
      setIsSuccess(true);

      // Store phone for next steps
      localStorage.setItem("identifier", phone);

      setTimeout(() => {
        navigate("/verify-otp", { state: { identifier: phone } });
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(150deg, #C5D9E8 0%, #B2CCDC 45%, #A0BBCC 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .fp-blob-1 {
          position: absolute; top: -120px; right: -120px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(136,189,242,0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .fp-blob-2 {
          position: absolute; bottom: -100px; left: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,73,89,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .fp-card {
          background: rgba(255,255,255,0.92);
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(36,51,64,0.18), 0 2px 8px rgba(36,51,64,0.08);
          width: 100%; max-width: 420px;
          overflow: hidden;
          animation: cardUp 0.42s cubic-bezier(.22,1,.36,1) forwards;
          opacity: 0;
        }

        @keyframes cardUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fp-header {
          background: linear-gradient(135deg, #243340, #384959);
          padding: 28px 32px 24px;
          position: relative;
        }

        .fp-logo-ring {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(255,255,255,0.14);
          border: 1.5px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }

        .fp-header-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 5px;
        }

        .fp-header-sub {
          font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5;
        }

        .fp-header::after {
          content: '';
          position: absolute; right: 24px; top: 24px;
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(136,189,242,0.18);
          border: 1px solid rgba(136,189,242,0.25);
        }

        .fp-body {
          padding: 28px 32px 32px;
          display: flex; flex-direction: column; gap: 20px;
        }

        .fp-field-label {
          font-size: 11px; font-weight: 700; color: #6A89A7;
          text-transform: uppercase; letter-spacing: 0.6px;
          margin-bottom: 7px; display: block;
        }

        .fp-input-wrap { position: relative; }

        .fp-input-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #6A89A7; pointer-events: none;
          display: flex; align-items: center;
        }

        .fp-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border: 1.5px solid #DDE9F5;
          border-radius: 10px;
          font-size: 14px; font-family: 'Inter', sans-serif;
          color: #243340; background: #EDF3FA;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          letter-spacing: 1px;
        }

        .fp-input::placeholder { color: #6A89A7; font-size: 13px; letter-spacing: 0; }

        .fp-input:focus {
          border-color: #88BDF2; background: #fff;
          box-shadow: 0 0 0 3px rgba(136,189,242,0.18);
        }

        .fp-hint {
          font-size: 11px; color: #6A89A7;
          margin-top: 6px;
          display: flex; align-items: center; gap: 5px;
        }

        /* ── Method toggle ── */
        .fp-method-label {
          font-size: 11px; font-weight: 700; color: #6A89A7;
          text-transform: uppercase; letter-spacing: 0.6px;
          margin-bottom: 9px; display: block;
        }

        .fp-method-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .fp-method-option {
          position: relative;
          cursor: pointer;
        }

        .fp-method-option input[type="radio"] {
          position: absolute;
          opacity: 0;
          width: 0; height: 0;
        }

        .fp-method-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border: 1.5px solid #DDE9F5;
          border-radius: 11px;
          background: #EDF3FA;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          user-select: none;
        }

        .fp-method-option input[type="radio"]:checked + .fp-method-card {
          border-color: #384959;
          background: rgba(56,73,89,0.06);
          box-shadow: 0 0 0 3px rgba(56,73,89,0.08);
        }

        .fp-method-card:hover {
          border-color: #88BDF2;
          background: #fff;
        }

        .fp-method-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(136,189,242,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s;
        }

        .fp-method-option input[type="radio"]:checked + .fp-method-card .fp-method-icon {
          background: rgba(56,73,89,0.14);
        }

        .fp-method-text {
          display: flex; flex-direction: column;
        }

        .fp-method-title {
          font-size: 12.5px; font-weight: 700; color: #243340; line-height: 1.2;
        }

        .fp-method-sub {
          font-size: 10.5px; color: #6A89A7; margin-top: 1px;
        }

        .fp-method-check {
          margin-left: auto;
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 1.5px solid #DDE9F5;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.18s, background 0.18s;
        }

        .fp-method-option input[type="radio"]:checked + .fp-method-card .fp-method-check {
          border-color: #384959;
          background: #384959;
        }

        /* ── Button ── */
        .fp-btn {
          width: 100%; padding: 13px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #384959, #243340);
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Inter', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 3px 12px rgba(36,51,64,0.28);
          transition: opacity 0.15s, transform 0.15s;
        }

        .fp-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .fp-message {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500; line-height: 1.45;
          animation: fadeIn 0.22s ease forwards;
        }

        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .fp-message-success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.28);
          color: #15803d;
        }

        .fp-message-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.22);
          color: #b91c1c;
        }

        .fp-divider {
          display: flex; align-items: center; gap: 10px;
          color: #6A89A7; font-size: 11px; font-weight: 600;
        }
        .fp-divider::before, .fp-divider::after {
          content: ''; flex: 1; height: 1px; background: #DDE9F5;
        }

        .fp-back-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #384959;
          text-decoration: none; cursor: pointer; transition: color 0.15s;
          background: none; border: none; font-family: 'Inter', sans-serif; width: 100%;
        }
        .fp-back-link:hover { color: #88BDF2; }

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fp-spinner { animation: spin 0.85s linear infinite; }

        @media (max-width: 480px) {
          .fp-header { padding: 22px 22px 20px; }
          .fp-body { padding: 22px 22px 26px; }
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-blob-1" />
        <div className="fp-blob-2" />

        <div className="fp-card">

          {/* ── Header ── */}
          <div className="fp-header">
            <div className="fp-logo-ring">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="fp-header-title">Forgot Password?</div>
            <div className="fp-header-sub">
              Enter your registered mobile number.<br />
              Choose how you'd like to receive your OTP.
            </div>
          </div>

          {/* ── Body ── */}
          <div className="fp-body">

            {/* Mobile number field */}
            <div>
              <label className="fp-field-label">Mobile Number</label>
              <div className="fp-input-wrap">
                <span className="fp-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </span>
                <input
                  className="fp-input"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  maxLength={13}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleSendOtp()}
                />
              </div>
              <div className="fp-hint">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                For students, use the parent's registered mobile number
              </div>
            </div>

            {/* ── OTP Delivery Method ── */}
            <div>
              <span className="fp-method-label">Send OTP via</span>
              <div className="fp-method-row">

                {/* SMS option */}
                <label className="fp-method-option">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="sms"
                    checked={method === "sms"}
                    onChange={() => setMethod("sms")}
                  />
                  <div className="fp-method-card">
                    <div className="fp-method-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#384959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="fp-method-text">
                      <span className="fp-method-title">SMS</span>
                      <span className="fp-method-sub">To your mobile</span>
                    </div>
                    <div className="fp-method-check">
                      {method === "sms" && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>

                {/* Email option */}
                <label className="fp-method-option">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="email"
                    checked={method === "email"}
                    onChange={() => setMethod("email")}
                  />
                  <div className="fp-method-card">
                    <div className="fp-method-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#384959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="fp-method-text">
                      <span className="fp-method-title">Email</span>
                      <span className="fp-method-sub">To registered email</span>
                    </div>
                    <div className="fp-method-check">
                      {method === "email" && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>

              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`fp-message ${isSuccess ? "fp-message-success" : "fp-message-error"}`}>
                {isSuccess ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Send OTP button */}
            <button
              className="fp-btn"
              onClick={handleSendOtp}
              disabled={loading || !phone.trim()}
            >
              {loading ? (
                <>
                  <svg className="fp-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending OTP…
                </>
              ) : (
                <>
                  {method === "sms" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                  Send OTP via {method === "sms" ? "SMS" : "Email"}
                </>
              )}
            </button>

            <div className="fp-divider">OR</div>

            <button className="fp-back-link" onClick={() => window.history.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}