import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cu-root {
    font-family: 'DM Sans', sans-serif;
    color: #384959;
    line-height: 1.6;
  }
  .cu-root h1, .cu-root h2, .cu-root h3 {
    font-family: 'Playfair Display', serif;
    line-height: 1.2;
  }

  @keyframes cu-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cu-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-14px); }
  }
  @keyframes cu-pulseRing {
    0%   { transform: scale(.9); opacity: .7; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  .cu-fadeUp { animation: cu-fadeUp .6s ease both; }
  .cu-d1 { animation-delay: .08s; }
  .cu-d2 { animation-delay: .18s; }
  .cu-d3 { animation-delay: .28s; }
  .cu-d4 { animation-delay: .38s; }

  /* ── Hero ── */
  .cu-hero {
    background: linear-gradient(160deg, #EDF5FE 0%, #dbeeff 100%);
    padding: 88px 32px 72px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cu-bubble {
    position: absolute;
    border-radius: 50%;
    background: #BDDDFC;
    opacity: .28;
    pointer-events: none;
    animation: cu-float 7s ease-in-out infinite;
  }
  .cu-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #6A89A7;
    background: #fff;
    border: 1px solid #D6E8FA;
    border-radius: 100px;
    padding: 5px 16px;
    margin-bottom: 20px;
  }
  .cu-hero h1 {
    font-size: clamp(32px, 5vw, 56px);
    color: #1E2D3D;
    margin-bottom: 18px;
  }
  .cu-hero h1 span { color: #88BDF2; }
  .cu-hero p {
    font-size: 16px;
    color: #6B7280;
    max-width: 480px;
    margin: 0 auto 40px;
    line-height: 1.8;
  }
  .cu-pill-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .cu-pill {
    background: #fff;
    border: 1px solid #D6E8FA;
    border-radius: 100px;
    padding: 7px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #384959;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Body ── */
  .cu-body {
    background: #F7FAFD;
    padding: 72px 32px;
  }
  .cu-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 40px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .cu-inner { grid-template-columns: 1fr; }
  }

  /* ── Contact Cards ── */
  .cu-cards { display: flex; flex-direction: column; gap: 20px; }
  .cu-card {
    background: #fff;
    border: 1px solid #D6E8FA;
    border-radius: 20px;
    padding: 30px 24px;
    text-align: center;
    transition: box-shadow .25s, transform .25s;
    cursor: default;
  }
  .cu-card:hover {
    box-shadow: 0 14px 44px #88BDF225;
    transform: translateY(-4px);
  }
  .cu-card.featured {
    background: linear-gradient(135deg, #6A89A7 0%, #88BDF2 100%);
    border-color: transparent;
    color: #fff;
  }
  .cu-icon-wrap {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    transition: transform .25s;
  }
  .cu-card:hover .cu-icon-wrap { transform: scale(1.1); }
  .cu-icon-wrap.light {
    background: #EDF5FE;
    border: 1.5px solid #D6E8FA;
  }
  .cu-icon-wrap.dark {
    background: rgba(255,255,255,.2);
    border: 1.5px solid rgba(255,255,255,.3);
  }
  .cu-card h3 {
    font-size: 16px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 6px;
  }
  .cu-card .sub {
    font-size: 13px;
    color: #9BAEC0;
    margin-bottom: 10px;
  }
  .cu-card.featured .sub { color: rgba(255,255,255,.65); }
  .cu-card a {
    font-size: 14px;
    font-weight: 500;
    color: #6A89A7;
    text-decoration: none;
    display: block;
    line-height: 1.7;
    transition: color .2s;
  }
  // .cu-card a:hover { color: #384959; text-decoration: underline; }
  .cu-card.featured a { color: #fff; font-weight: 600; }
  .cu-card.featured a:hover { opacity: .85; text-decoration: none; }
  .cu-card h3 a { color: #1E2D3D; }

  /* ── Form Card ── */
  .cu-form-card {
    background: #fff;
    border: 1px solid #D6E8FA;
    border-radius: 24px;
    padding: 44px 40px;
    box-shadow: 0 16px 64px #1E2D3D0A;
  }
  @media (max-width: 600px) {
    .cu-form-card { padding: 28px 20px; }
    .cu-body { padding: 48px 16px; }
  }
  .cu-form-head { margin-bottom: 30px; }
  .cu-form-head h2 {
    font-size: clamp(22px, 3vw, 32px);
    color: #1E2D3D;
    margin-bottom: 6px;
  }
  .cu-form-head h2 span { color: #88BDF2; }
  .cu-form-head p { font-size: 13px; color: #6B7280; }

  .cu-row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 500px) {
    .cu-row2 { grid-template-columns: 1fr; }
  }
  .cu-field { margin-bottom: 18px; }
  .cu-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #384959;
    margin-bottom: 7px;
    letter-spacing: .01em;
  }
  .cu-field input,
  .cu-field select,
  .cu-field textarea {
    width: 100%;
    padding: 13px 16px;
    border: 1.5px solid #D6E8FA;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #1E2D3D;
    background: #EDF5FE;
    outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
    appearance: none;
  }
  .cu-field input:focus,
  .cu-field select:focus,
  .cu-field textarea:focus {
    border-color: #88BDF2;
    background: #fff;
    box-shadow: 0 0 0 3px #88BDF214;
  }
  .cu-field input::placeholder,
  .cu-field textarea::placeholder { color: #A3B8CC; }
  .cu-field select { cursor: pointer; }
  .cu-field textarea { resize: vertical; min-height: 130px; }

  .cu-btn {
    width: 100%;
    padding: 14px;
    background: #6A89A7;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 100px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 18px #6A89A750;
  }
  .cu-btn:hover {
    background: #384959;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px #6A89A76A;
  }
  .cu-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #1E2D3D;
    color: #fff;
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 500;
    animation: cu-fadeUp .35s ease both;
  }
`;

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2" width="24" height="24">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconPhone = ({ color = "#6A89A7" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width="24" height="24">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.18C1.52 2.09 2.37 1 3.46 1h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 5.36 5.36l.78-.78a2 2 0 0 1 2.1-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 21 15.19v1.73z"/>
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2" width="24" height="24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconSend = ({ size = 24, color = "#6A89A7" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width={size} height={size}>
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2" width="13" height="13">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6A89A7" strokeWidth="2" width="13" height="13">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#88BDF2" strokeWidth="2" width="18" height="18">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", subject: "", message: ""
  });

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.email || !form.message) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="cu-root">
      <style>{styles}</style>

      {/* ── Hero ── */}
      <section className="cu-hero">
        <div className="cu-bubble" style={{ width: 420, height: 420, top: -130, right: -90 }} />
        <div className="cu-bubble" style={{ width: 260, height: 260, bottom: -70, left: -50, animationDelay: "2.5s" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "50px 0" }}>
          <div className="cu-badge cu-fadeUp">
            <IconMessage /> Contact Us
          </div>
          <h1 className="cu-fadeUp cu-d1">
            We'd Love to <span>Hear From You</span>
          </h1>
          <p className="cu-fadeUp cu-d2">
            Have questions or need help? Our team is ready to assist you with all your school management needs — usually within a few hours.
          </p>
          <div className="cu-pill-row cu-fadeUp cu-d3">
            <div className="cu-pill"><IconClock /> Avg. 3hr response</div>
            <div className="cu-pill"><IconPhone color="#6A89A7" /> Live support available</div>
            <div className="cu-pill"><IconStar /> Dedicated onboarding</div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="cu-body">
        <div className="cu-inner">

          {/* Contact Cards */}
          <div className="cu-cards cu-fadeUp">
            <div className="cu-card">
              <div className="cu-icon-wrap light"><IconMail /></div>
              <h3>Email Us</h3>
              <p className="sub">We reply within a few hours</p>
              <a href="mailto:support@eduabaccotech.com">support@eduabaccotech.com</a>
            </div>

            <div className="cu-card featured">
              <div className="cu-icon-wrap dark"><IconPhone color="#fff" /></div>
              <h3>Call Us</h3>
              <a href="tel:+919972452044">+91 9972452044</a>
            </div>

            <div className="cu-card">
              <div className="cu-icon-wrap light"><IconMapPin /></div>
              <h3><a href="https://maps.app.goo.gl/gXSu8AhJEAkCTm138" target="_blank" rel="noopener noreferrer">Visit Us</a></h3>
              <p className="sub">Walk-ins welcome</p>
              <a href="https://maps.app.goo.gl/gXSu8AhJEAkCTm138" target="_blank" rel="noopener noreferrer">
                No 12,13 &amp; 12/A, Kirthan Arcade, 3rd Floor, Aditya Nagar,
                Sandeep Unnikrishnan Road, Bangalore — 560097
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="cu-form-card cu-fadeUp cu-d4">
            <div className="cu-form-head">
              <div className="cu-badge" style={{ marginBottom: 14 }}>
                <IconSend size={11} color="#6A89A7" /> Send a Message
              </div>
              <h2>How Can We <span>Help?</span></h2>
              <p>Fill in the form and we'll get back to you shortly.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="cu-row2">
                <div className="cu-field">
                  <label>First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" />
                </div>
                <div className="cu-field">
                  <label>Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Smith" />
                </div>
              </div>

              <div className="cu-field">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@yourschool.edu" />
              </div>

              <div className="cu-field">
                <label>Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange}>
                  <option value="">Select a topic…</option>
                  <option>General Inquiry</option>
                  <option>Demo Request</option>
                  <option>Technical Support</option>
                  <option>Pricing &amp; Plans</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div className="cu-field">
                <label>Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us how we can help your school…" />
              </div>

              {submitted ? (
                <div className="cu-toast">
                  <IconCheck />
                  Message sent! We'll be in touch within a few hours.
                </div>
              ) : (
                <button type="submit" className="cu-btn">
                  <IconSend size={15} color="#fff" />
                  Send Message
                </button>
              )}
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}