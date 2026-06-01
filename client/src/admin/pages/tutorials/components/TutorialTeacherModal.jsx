import React, { useEffect, useState } from "react";
import { X, Check, Loader2, BookMarked } from "lucide-react";
import TutorialTeacherForm from "./TutorialTeacherForm";
import { C } from "./C";
import { getTeacherDropdown, getSubjects, getGrades, createTutorialTeacher, updateTutorialTeacher } from "../services/tutorialService";

const TutorialTeacherModal = ({ onClose, onSaved, editing }) => {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);

  const [form, setForm] = useState({
    teacherId: "", bio: "", mode: "ONLINE", monthlyFee: "", grades: [], subjects: [],
    capacity: "", rating: "", passPercentage: "", averageStudentScore: "", adminPriority: "", isActive: true,
  });

  useEffect(() => {
    Promise.all([
      getTeacherDropdown().then(d => setTeachers(d || [])),
      getSubjects().then(d => setSubjects(d || [])),
      getGrades().then(d => setGrades(d || []))
    ]).catch(console.error);

    if (editing) {
      setForm({
        teacherId: editing.teacherId,
        bio: editing.bio || "",
        mode: editing.mode || "ONLINE",
        monthlyFee: editing.monthlyFee || "",
        grades: editing.grades || [],
        subjects: editing.subjects || [],
        capacity: editing.capacity || "",
        rating: editing.rating || "",
        passPercentage: editing.passPercentage || "",
        averageStudentScore: editing.averageStudentScore || "",
        adminPriority: editing.adminPriority || "",
        isActive: editing.isActive,
      });
    }
  }, [editing]);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArray = (key, value) => {
    setForm(p => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter(x => x !== value) : [...p[key], value]
    }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (editing) {
        await updateTutorialTeacher(editing.id, form);
      } else {
        await createTutorialTeacher(form);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div 
        className="hl-fade flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border"
        style={{ borderColor: C.borderLight }}
      >
        {/* Header Block matching row templates */}
        <div 
          className="flex items-center justify-between border-b px-5 py-4 shrink-0"
          style={{ background: `linear-gradient(90deg, ${C.bg}, ${C.white})`, borderColor: C.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ background: `linear-gradient(135deg, ${C.sky}, ${C.deep})`, borderColor: C.deep }}
            >
              <BookMarked size={16} color="#fff" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: C.text }}>
                {editing ? "Edit Tutorial Configuration" : "Add New Tutorial Instructor"}
              </h2>
              <p className="text-[11px]" style={{ color: C.textLight }}>Configure tracking routes & resource weights</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-400 hover:text-slate-600 transition-all"
            style={{ borderColor: C.border }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Form Window Box Container */}
        <div className="overflow-y-auto p-5 sm:p-6 bg-slate-50/30">
          <TutorialTeacherForm
            form={form} update={update} toggleArray={toggleArray}
            teachers={teachers} subjects={subjects} grades={grades} editing={editing}
          />
        </div>

        {/* Action Bottom Tray Buttons */}
        <div className="flex justify-end gap-2.5 border-t px-5 py-3.5 bg-white shrink-0" style={{ borderColor: C.borderLight }}>
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-xs font-bold transition-all"
            style={{ backgroundColor: C.bg, borderColor: C.border, color: C.textLight }}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition-all shadow-md"
            style={{ background: `linear-gradient(135deg, ${C.slate}, ${C.deep})` }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {editing ? "Save Changes" : "Create Entry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTeacherModal;