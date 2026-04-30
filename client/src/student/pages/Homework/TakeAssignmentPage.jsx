import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { getToken } from "../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;
const C = {
  slate: "#6A89A7", mist: "#BDDDFC", sky: "#88BDF2", deep: "#384959",
  bg: "#EDF3FA", white: "#FFFFFF", border: "#C8DCF0", borderLight: "#DDE9F5",
  text: "#243340", textLight: "#6A89A7",
};

export default function TakeAssignmentPage() {
  const navigate = useNavigate();
  const { id: assignmentId } = useParams();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");

  const autoSubmitted   = useRef(false);
  const dataRef         = useRef(null);
  const answersRef      = useRef({});
  const assignmentIdRef = useRef(assignmentId);

  useEffect(() => { fetchAssignment(); }, [assignmentId]);

  async function fetchAssignment() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/student`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await res.json();

      assignmentIdRef.current = assignmentId;

      const enrichedData = d.data?.questionsWithAnswers
        ? {
            ...d.data,
            assignment: {
              ...d.data.assignment,
              questions: d.data.questionsWithAnswers,
            },
          }
        : d.data;

      dataRef.current = enrichedData;
      setData(enrichedData);

      if (d.data?.submission) setResult(d.data.submission);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function setAnswer(qId, patch) {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: { ...(prev[qId] || {}), ...patch } };
      answersRef.current = updated;
      return updated;
    });
  }

  const buildResponses = () => {
    const currentData    = dataRef.current;
    const currentAnswers = answersRef.current;
    if (!currentData?.assignment?.questions) return [];
    return currentData.assignment.questions.map((q) => ({
      questionId:    q.id,
      selectedIndex: currentAnswers[q.id]?.selectedIndex ?? null,
      answerText:    currentAnswers[q.id]?.answerText || "",
    }));
  };

  const submitUsingBeacon = () => {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    try {
      const formData = new FormData();
      formData.append("responses", JSON.stringify(buildResponses()));
      navigator.sendBeacon(
        `${API_URL}/api/assignments/${assignmentIdRef.current}/submit`,
        formData
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoSubmit = async () => {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    try {
      await handleSubmit(true);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) submitUsingBeacon();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const handlePageHide = () => submitUsingBeacon();
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handleBack = () => {
      if (result) {
        navigate("/student/homework");
        return;
      }
      submitUsingBeacon();
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [result]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        submitUsingBeacon();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSubmit(isAutoSubmit = false) {
    if (!data?.assignment) return;
    const qs = data.assignment.questions;

    if (!isAutoSubmit) {
      for (const q of qs) {
        if (q.type === "MCQ" && answers[q.id]?.selectedIndex === undefined) {
          return setError(`Please answer question ${q.order + 1}`);
        }
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const fd = new FormData();
      const responsePayload = qs.map((q) => ({
        questionId:    q.id,
        selectedIndex: answers[q.id]?.selectedIndex ?? null,
        answerText:    answers[q.id]?.answerText || null,
      }));
      fd.append("responses", JSON.stringify(responsePayload));

      for (const q of qs) {
        if (q.type === "WRITTEN" && answers[q.id]?.file) {
          fd.append(q.id, answers[q.id].file);
        }
      }

      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Failed");

      // ✅ Update questions with correctIndex revealed after submission
      if (d.data?.questionsWithAnswers) {
        setData((prev) => ({
          ...prev,
          assignment: {
            ...prev.assignment,
            questions: d.data.questionsWithAnswers,
          },
        }));
      }

      setResult(d.data);

      if (isAutoSubmit) {
        alert("Assignment auto-submitted because exam screen was exited.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 80, borderRadius: 14, background: `${C.mist}55` }} />
      ))}
    </div>
  );

  if (error && !data) return (
    <div style={{ padding: 24, color: "#c0392b", fontSize: 13 }}>{error}</div>
  );

  // ── Result screen ──────────────────────────────────────────
  if (result) {
    const isMCQOnly = data?.assignment?.questions?.every((q) => q.type === "MCQ");
    return (
      <ResultScreen
        result={result}
        questions={data?.assignment?.questions || []}
        isMCQOnly={isMCQOnly}
      />
    );
  }

  const { assignment } = data || {};
  if (!assignment) return null;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{
        width: "100%", minHeight: "100vh", background: "#f4f7fb",
        padding: window.innerWidth < 768 ? "10px" : "24px",
        boxSizing: "border-box",
      }}>
        <div style={{
          marginBottom: 24, padding: "18px 20px", borderRadius: 16,
          background: C.white, border: `1.5px solid ${C.borderLight}`,
        }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: C.text }}>
            {assignment.title}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: C.textLight }}>
            {assignment.subject?.name} · Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </p>
          {assignment.description && (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: C.textLight, lineHeight: 1.6 }}>
              {assignment.description}
            </p>
          )}
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, background: "#fee8e8",
            border: "1px solid #f5b0b0", marginBottom: 16, fontSize: 12,
            color: "#8b1c1c", display: "flex", gap: 8, alignItems: "center",
          }}>
            <AlertCircle size={13} />{error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {assignment.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              answer={answers[q.id] || {}}
              onAnswer={(patch) => setAnswer(q.id, patch)}
            />
          ))}
        </div>

        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          style={{
            marginTop: 24, width: "100%", padding: "14px", borderRadius: 14,
            border: "none", background: `linear-gradient(135deg, ${C.slate}, ${C.deep})`,
            color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {submitting
            ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
            : "Submit Assignment"}
        </button>
      </div>
    </>
  );
}

// ── Question Card ──────────────────────────────────────────────
function QuestionCard({ q, index, answer, onAnswer }) {
  const fileRef = useRef();

  return (
    <div style={{
      padding: 18, borderRadius: 16,
      border: `1.5px solid ${q.type === "MCQ" ? C.borderLight : "#e9d5ff"}`,
      background: q.type === "MCQ" ? C.white : "#faf5ff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700,
          background: q.type === "MCQ" ? `${C.mist}66` : "#ede9fe",
          color: q.type === "MCQ" ? C.deep : "#7c3aed",
        }}>
          Q{index + 1} · {q.type === "MCQ" ? "Multiple Choice" : "Written"} · {q.marks} mark{q.marks !== 1 ? "s" : ""}
        </span>
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.6 }}>
        {q.questionText}
      </p>

      {q.type === "MCQ" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map((opt, oIdx) => {
            const selected = answer.selectedIndex === oIdx;
            return (
              <button
                key={oIdx}
                onClick={() => onAnswer({ selectedIndex: oIdx })}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, textAlign: "left",
                  border: `2px solid ${selected ? C.deep : C.border}`,
                  background: selected ? `${C.mist}55` : "#fff",
                  cursor: "pointer", width: "100%", transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                  border: `2px solid ${selected ? C.deep : C.border}`,
                  background: selected ? C.deep : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <div style={{ width: 8, height: 8, borderRadius: 99, background: "#fff" }} />}
                </div>
                <span style={{
                  fontSize: 13, color: C.text, fontFamily: "'Inter', sans-serif",
                  fontWeight: selected ? 700 : 500,
                }}>
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <textarea
            placeholder="Type your answer here (optional if uploading a file)..."
            value={answer.answerText || ""}
            onChange={(e) => onAnswer({ answerText: e.target.value })}
            rows={4}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: `1.5px solid ${C.border}`, fontFamily: "'Inter', sans-serif",
              fontSize: 13, color: C.text, background: "#fff",
              resize: "vertical", outline: "none", marginBottom: 10,
            }}
          />
          {answer.file ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 10,
              background: "#e8f0fd", border: "1px solid #b3ccf5",
            }}>
              <span style={{
                flex: 1, fontSize: 12, color: C.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {answer.file.name}
              </span>
              <button onClick={() => onAnswer({ file: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={12} color="#c0392b" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: `1.5px dashed ${C.border}`, background: "transparent",
                color: C.textLight, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              <Upload size={13} /> Upload written answer (image/PDF)
            </button>
          )}
          <input
            ref={fileRef} type="file" accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={(e) => onAnswer({ file: e.target.files[0] })}
          />
        </div>
      )}
    </div>
  );
}

// ── Result Screen ──────────────────────────────────────────────
function ResultScreen({ result, questions, isMCQOnly }) {
  const pct = result.percentage;

  return (
    <div style={{
      maxWidth: 600, margin: "0 auto", padding: "32px 16px",
      fontFamily: "'Inter', sans-serif", textAlign: "center",
    }}>
      <div style={{
        padding: 32, borderRadius: 24,
        background: C.white, border: `1.5px solid ${C.borderLight}`,
        boxShadow: "0 8px 32px rgba(56,73,89,0.10)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {pct >= 80 ? "🏆" : pct >= 50 ? "✅" : "📝"}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: C.text }}>
          {isMCQOnly ? "Results" : "Submitted!"}
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.textLight }}>
          {isMCQOnly
            ? "Your answers have been automatically graded."
            : "Your teacher will review written answers soon."}
        </p>

        {pct !== null && (
          <div style={{
            width: 120, height: 120, borderRadius: 99,
            background: `conic-gradient(${pct >= 50 ? "#16a34a" : "#c0392b"} ${pct * 3.6}deg, ${C.bg} 0deg)`,
            margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 90, height: 90, borderRadius: 99, background: "#fff",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{pct?.toFixed(0)}%</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: pct >= 50 ? "#16a34a" : "#c0392b" }}>
                {result.grade}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {result.mcqScore !== null && (
            <InfoBox label="MCQ Score" value={`${result.mcqScore} / ${result.mcqMaxScore}`} />
          )}
          {result.writtenScore !== null && result.writtenMaxScore > 0 && (
            <InfoBox label="Written Score" value={`${result.writtenScore ?? "?"} / ${result.writtenMaxScore}`} />
          )}
          {result.totalScore !== null && (
            <InfoBox label="Total Score" value={`${result.totalScore} / ${result.totalMaxScore}`} />
          )}
          {result.isLate && <InfoBox label="Submitted" value="⏰ Late" />}
        </div>

        {isMCQOnly && result.responses?.length > 0 && (
          <div style={{ textAlign: "left", marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>Answer Breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.responses.map((r) => {
                const fullQ = questions.find((q) => q.id === r.questionId);
                const marks = fullQ?.marks ?? "?";
                const questionText = fullQ?.questionText || "Question";
                const selectedAnswer =
                  r.selectedIndex !== null
                    ? fullQ?.options?.[r.selectedIndex] || `Option ${r.selectedIndex + 1}`
                    : "—";
                const correctAnswer =
                  fullQ?.options?.[fullQ?.correctIndex] || "—";

                return (
                  <div
                    key={r.id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: r.isCorrect ? "#f0fdf4" : "#fff5f5",
                      border: `1.5px solid ${r.isCorrect ? "#86efac" : "#f5b0b0"}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{r.isCorrect ? "✅" : "❌"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, textDecoration: "none" }}>
                      {questionText}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: C.textLight, textDecoration: "none" }}>
                      Your answer: <strong>{selectedAnswer}</strong>
                      {!r.isCorrect && (
                        <> · Correct: <strong style={{ color: "#16a34a" }}>{correctAnswer}</strong></>
                      )}
                    </p>
                  </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.isCorrect ? "#16a34a" : "#c0392b" }}>
                      {r.isCorrect ? `+${marks}` : "0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result.teacherFeedback && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 12,
            background: `${C.mist}33`, border: `1.5px solid ${C.border}`, textAlign: "left",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>
              Teacher Feedback
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.text }}>{result.teacherFeedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 12, background: C.bg, border: `1.5px solid ${C.borderLight}` }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: C.text }}>{value}</p>
    </div>
  );
}