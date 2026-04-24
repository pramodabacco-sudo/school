// client/src/teacher/pages/profile/profile.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Briefcase,
  BookOpen,
  FileText,
  CreditCard,
  RefreshCw,
  WifiOff,
} from "lucide-react";

import { getToken } from "../../../auth/storage.js";

import { C, PROFILE_CSS } from "./components/shared.jsx";

import TeacherSidebar from "./components/ProfileSidebar.jsx";
import PersonalInfo from "./components/PersonalInfo.jsx";
import ProfessionalInfo from "./components/ProfessionalInfo.jsx";
import AssignmentInfo from "./components/AssignmentsInfo.jsx";
import DocumentsInfo from "./components/DocumentsInfo.jsx";
import BankInfo from "./components/BankInfo.jsx";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function apiFetch(path, retries = 3, delayMs = 600) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API}${path}`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    } catch (err) {
      lastError = err;

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

const TABS = [
  { key: "personal", label: "Personal", icon: User },
  { key: "professional", label: "Professional", icon: Briefcase },
  { key: "assignments", label: "Assignments", icon: BookOpen },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "bank", label: "Bank", icon: CreditCard },
];

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
        padding: "12px 15px",
        borderRadius: 14,
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        color: "#b91c1c",
        fontSize: 12,
        marginBottom: 15,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <WifiOff size={15} />
        {message}
      </div>

      <button
        onClick={onRetry}
        style={{
          border: "none",
          borderRadius: 20,
          padding: "6px 14px",
          background: "#b91c1c",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        <RefreshCw size={11} />
        Retry
      </button>
    </div>
  );
}

export default function TeacherProfile() {
  const [tab, setTab] = useState("personal");
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [retry, setRetry] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const teacherId = user?.teacherId;

  const fetchData = useCallback(() => {
    setLoading(true);
    setErr(null);

    apiFetch(`/api/teachers/me`)
      .then((json) => setTeacher(json.data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [teacherId, retry]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fullName = teacher
    ? `${teacher.firstName} ${teacher.lastName || ""}`
    : "Teacher";

  return (
    <>
      <style>{PROFILE_CSS}</style>

      <div className="pf-page">
        <div className="a1" style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  width: 4,
                  height: 30,
                  borderRadius: 99,
                  background: `linear-gradient(180deg, ${C.light}, ${C.dark})`,
                }}
              />

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(18px,4vw,25px)",
                    fontWeight: 900,
                    color: C.dark,
                  }}
                >
                  {loading ? "Loading..." : fullName}
                </h1>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11,
                    color: C.mid,
                  }}
                >
                  {teacher?.designation || "Teacher"} ·{" "}
                  {teacher?.employeeCode || "--"}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 15,
                background: "rgba(255,255,255,.75)",
                border: "1px solid rgba(136,189,242,.22)",
                overflowX: "auto",
              }}
            >
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`pf-tab ${tab === key ? "active" : ""}`}
                  onClick={() => setTab(key)}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {err && !loading && (
          <ErrorBanner
            message={err}
            onRetry={() => setRetry((v) => v + 1)}
          />
        )}

        <div className="pf-card pf-layout a2">
          <TeacherSidebar teacher={teacher} loading={loading} />

          <div className="pf-content">
            {tab === "personal" && (
              <PersonalInfo
                teacher={teacher}
                loading={loading}
                error={err}
              />
            )}

            {tab === "professional" && (
              <ProfessionalInfo
                teacher={teacher}
                loading={loading}
                error={err}
              />
            )}

            {tab === "assignments" && (
              <AssignmentInfo
                teacher={teacher}
                loading={loading}
                error={err}
              />
            )}

            {tab === "documents" && (
              <DocumentsInfo
                docs={teacher?.documents || []}
                loading={loading}
                error={err}
              />
            )}

            {tab === "bank" && (
              <BankInfo
                teacher={teacher}
                loading={loading}
                error={err}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}