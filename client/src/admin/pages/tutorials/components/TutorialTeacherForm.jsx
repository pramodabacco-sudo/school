import React, { useMemo, useState } from "react";
import { Star, TrendingUp, BadgeCheck, Search } from "lucide-react";
import { C } from "./C";

const modes = ["ONLINE", "OFFLINE", "HYBRID"];

const inputClass = "w-full rounded-xl border px-3.5 py-2 text-xs font-semibold outline-none transition-all";

const TutorialTeacherForm = ({
  form, update, toggleArray, teachers, subjects, grades, editing
}) => {
  const [teacherSearch, setTeacherSearch] = useState("");

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) =>
      `${t.name} ${t.designation || ""}`.toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const inlineFieldStyle = {
    background: C.bg,
    borderColor: C.border,
    color: C.text,
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <div className="space-y-5">
      {/* Search Input Section */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>
          Select Classroom Instructor
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textLight }} />
          <input
            type="text"
            placeholder="Filter instructors by name or profile designation..."
            value={teacherSearch}
            disabled={!!editing}
            onChange={(e) => setTeacherSearch(e.target.value)}
            className={inputClass}
            style={{ ...inlineFieldStyle, paddingLeft: "2.5rem" }}
          />
        </div>

        {/* Droplist Picker view wrapper */}
        <div 
          className="mt-2 max-h-40 overflow-y-auto rounded-xl border bg-white"
          style={{ borderColor: C.borderLight }}
        >
          {filteredTeachers.length === 0 ? (
            <div className="px-4 py-3 text-xs italic" style={{ color: C.textLight }}>
              No master instances found match queries
            </div>
          ) : (
            filteredTeachers.map((t) => {
              const active = form.teacherId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!editing}
                  onClick={() => {
                    update("teacherId", t.id);
                    setTeacherSearch(t.name);
                  }}
                  className="flex w-full items-center justify-between border-b px-4 py-2.5 text-left transition-all last:border-none"
                  style={{ 
                    borderColor: C.borderLight, 
                    backgroundColor: active ? `${C.mist}33` : "transparent" 
                  }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: C.text }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: C.textLight }}>{t.designation || "—"}</p>
                  </div>
                  {active && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: C.deep }} />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Grid Inputs for Base Variables */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Mode</label>
          <select
            value={form.mode}
            onChange={(e) => update("mode", e.target.value)}
            className={inputClass}
            style={inlineFieldStyle}
          >
            {modes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Monthly Fee (₹)</label>
          <input
            value={form.monthlyFee}
            onChange={(e) => update("monthlyFee", e.target.value)}
            placeholder="e.g. 2500"
            className={inputClass}
            style={inlineFieldStyle}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Capacity Limit</label>
          <input
            value={form.capacity}
            onChange={(e) => update("capacity", e.target.value)}
            placeholder="30"
            className={inputClass}
            style={inlineFieldStyle}
          />
        </div>
      </div>

      {/* Section Embedded Wrapper for Performance metrics */}
      <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: C.border, backgroundColor: C.white }}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-amber-600" style={{ backgroundColor: `${C.mist}33` }}>
            <Star size={16} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>Performance Configurations</h4>
            <p className="text-[10px] font-medium" style={{ color: C.textLight }}>Set system rank attributes & historical logs</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Rating Star Range</label>
            <input
              value={form.rating}
              onChange={(e) => update("rating", e.target.value)}
              placeholder="4.8"
              className={inputClass}
              style={inlineFieldStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Pass Percentage Metrics</label>
            <input
              value={form.passPercentage}
              onChange={(e) => update("passPercentage", e.target.value)}
              placeholder="92"
              className={inputClass}
              style={inlineFieldStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Avg Student Score</label>
            <input
              value={form.averageStudentScore}
              onChange={(e) => update("averageStudentScore", e.target.value)}
              placeholder="88"
              className={inputClass}
              style={inlineFieldStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>Admin Priority Weights</label>
            <input
              value={form.adminPriority}
              onChange={(e) => update("adminPriority", e.target.value)}
              placeholder="1"
              className={inputClass}
              style={inlineFieldStyle}
            />
          </div>
        </div>
      </div>

      {/* Multi-Select Group Pill Blocks for Subjects */}
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>
          Assigned Course Disciplines (Subjects)
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {subjects.map((s) => {
            const val = typeof s === "string" ? s : s.name;
            const hasPill = form.subjects.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggleArray("subjects", val)}
                className="flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all truncate"
                style={{
                  borderColor: hasPill ? C.deep : C.borderLight,
                  background: hasPill ? `linear-gradient(135deg, ${C.slate}, ${C.deep})` : C.white,
                  color: hasPill ? C.white : C.text,
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Select Group Pill Blocks for Grades */}
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>
          Target Classroom Grades
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {grades.map((g) => {
            const val = typeof g === "string" ? g : g.grade;
            const hasPill = form.grades.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggleArray("grades", val)}
                className="flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition-all truncate"
                style={{
                  borderColor: hasPill ? C.deep : C.borderLight,
                  background: hasPill ? `linear-gradient(135deg, ${C.slate}, ${C.deep})` : C.white,
                  color: hasPill ? C.white : C.text,
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Area Description */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>
          Public Biography Note Description
        </label>
        <textarea
          rows={3}
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Enter profile experience notes here..."
          className={inputClass}
          style={inlineFieldStyle}
        />
      </div>
    </div>
  );
};

export default TutorialTeacherForm;