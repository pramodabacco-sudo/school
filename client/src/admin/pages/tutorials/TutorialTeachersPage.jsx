import React, { useEffect, useState } from "react";
import { Plus, RefreshCw, BookMarked, ChevronLeft, ChevronRight } from "lucide-react";
import TutorialTeacherCard from "./components/TutorialTeacherCard";
import TutorialTeacherModal from "./components/TutorialTeacherModal";
import LoadingGrid from "./components/LoadingGrid";
import EmptyState from "./components/EmptyState";
import { C } from "./components/C";
import { getTutorialTeachers, deleteTutorialTeacher } from "./services/tutorialService";

const TutorialTeachersPage = () => {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getTutorialTeachers(page, 20);
      setTeachers(response.teachers || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      setTeachers([]);
    } bits: {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSpinning(true);
    fetchData().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleDelete = async (id, name) => {
    const ok = window.confirm(`Archive profile tracking entry for selected teacher?`);
    if (!ok) return;
    await deleteTutorialTeacher(id);
    fetchData();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundColor: C.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Structural Global Injection Styles */}
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes hl-spin { to { transform: rotate(360deg); } }
        .hl-spinning { animation: hl-spin 0.6s linear; }
        .hl-fade { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* Main Header Row Block */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hl-fade">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-6 w-1 rounded-full" style={{ background: `linear-gradient(180deg, ${C.sky}, ${C.deep})` }} />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: C.text }}>
              Tutorial Management Portal
            </h1>
          </div>
          <p className="pl-3.5 text-xs font-medium" style={{ color: C.textLight }}>
            Configure directory listings, capacity limits, and scoring profiles
          </p>
        </div>

        {/* Right side global control tray */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white transition-all"
            style={{ borderColor: C.borderLight, color: C.textLight }}
          >
            <RefreshCw size={14} className={spinning ? "hl-spinning" : ""} />
          </button>

          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.slate}, ${C.deep})` }}
          >
            <Plus size={14} />
            Add Instructor
          </button>
        </div>
      </div>

      {/* Main Grid Card Content Enclosure container */}
      <div 
        className="overflow-hidden rounded-2xl border bg-white hl-fade"
        style={{ borderColor: C.borderLight, boxShadow: "0 4px 20px rgba(56,73,89,0.03)", animationDelay: "0.05s" }}
      >
        <div 
          className="border-b px-5 py-4"
          style={{ background: `linear-gradient(90deg, ${C.bg}55, ${C.white})`, borderColor: C.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: C.border, backgroundColor: C.white }}
            >
              <BookMarked size={16} style={{ color: C.slate }} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.text }}>
                Active Registry Logs
              </h2>
              <p className="text-[10px] font-bold" style={{ color: C.textLight }}>
                {teachers.length} Registry item{teachers.length === 1 ? "" : "s"} listed total
              </p>
            </div>
          </div>
        </div>

        {/* Interior Container Wrapper layout blocks */}
        <div className="p-4 sm:p-5 md:p-6 bg-slate-50/20">
          {loading ? (
            <LoadingGrid />
          ) : teachers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <TutorialTeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onEdit={() => {
                    setEditing(teacher);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(teacher.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Premium Pagination Controls */}
      {!loading && teachers.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 hl-fade" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs font-semibold" style={{ color: C.textLight }}>
            Showing page <span style={{ color: C.text }}>{pagination.page}</span> of <span style={{ color: C.text }}>{pagination.totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-9 items-center gap-1 rounded-xl border px-4 text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{ 
                borderColor: C.border, 
                backgroundColor: page === 1 ? C.bg : C.white, 
                color: C.text 
              }}
              onMouseEnter={e => { if (page !== 1) e.currentTarget.style.backgroundColor = C.bg; }}
              onMouseLeave={e => { if (page !== 1) e.currentTarget.style.backgroundColor = C.white; }}
            >
              <ChevronLeft size={14} style={{ color: C.slate }} />
              Previous
            </button>

            {/* Next Button */}
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-9 items-center gap-1 rounded-xl border px-4 text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{ 
                borderColor: C.border, 
                backgroundColor: page >= pagination.totalPages ? C.bg : C.white, 
                color: C.text 
              }}
              onMouseEnter={e => { if (page < pagination.totalPages) e.currentTarget.style.backgroundColor = C.bg; }}
              onMouseLeave={e => { if (page < pagination.totalPages) e.currentTarget.style.backgroundColor = C.white; }}
            >
              Next
              <ChevronRight size={14} style={{ color: C.slate }} />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Form Lifecycle Modal Injection entry point */}
      {showModal && (
        <TutorialTeacherModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default TutorialTeachersPage;