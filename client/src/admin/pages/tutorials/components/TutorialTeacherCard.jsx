import React from "react";
import {
  User, Monitor, IndianRupee, Users, GraduationCap, Layers3,
  Pencil, Trash2, Star, TrendingUp, Award, BadgeCheck
} from "lucide-react";
import InfoRow from "./InfoRow";
import { C } from "./C";

const TutorialTeacherCard = ({ teacher, onEdit, onDelete }) => {
  return (
    <div 
      className="overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5"
      style={{ 
        borderColor: C.borderLight,
        boxShadow: `0 4px 20px rgba(56,73,89,0.05)`,
      }}
    >
      {/* Header Profile Section */}
      <div 
        className="flex items-start justify-between border-b p-4 sm:p-5" 
        style={{ borderColor: C.borderLight, background: `linear-gradient(90deg, ${C.bg}44, ${C.white})` }}
      >
        <div className="flex gap-3 min-w-0">
          <div 
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border"
            style={{ background: `linear-gradient(135deg, ${C.mist}44, ${C.white})`, borderColor: C.border }}
          >
            <User size={16} style={{ color: C.deep }} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold sm:text-sm" style={{ color: C.text }}>
              {teacher.teacher?.firstName} {teacher.teacher?.lastName}
            </h3>
            <p className="truncate text-[11px] font-medium mt-0.5" style={{ color: C.textLight }}>
              {teacher.teacher?.designation || "Instructor"}
            </p>
            
            {/* Badge Array row */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {teacher.rating ? (
                <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <Star size={10} className="fill-amber-600 text-amber-600" />
                  {teacher.rating}/5
                </div>
              ) : (
                <div className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                  New Join
                </div>
              )}

              {teacher.passPercentage ? (
                <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <TrendingUp size={10} />
                  {teacher.passPercentage}% Pass
                </div>
              ) : (
                <div className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                  Mid Rank
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action / Status Pill */}
        <div
          className="rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase border shrink-0"
          style={{
            backgroundColor: teacher.isActive ? "#F0FDF4" : "#FFF1F2",
            borderColor: teacher.isActive ? "#BBF7D0" : "#FEE2E2",
            color: teacher.isActive ? "#15803D" : "#B91C1C",
          }}
        >
          {teacher.isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Grid Fields Body */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 sm:p-5">
        <InfoRow icon={Monitor} label="Mode" value={teacher.mode} />
        <InfoRow icon={IndianRupee} label="Fee" value={teacher.monthlyFee ? `₹${teacher.monthlyFee}` : "—"} />
        <InfoRow icon={Users} label="Capacity" value={teacher.capacity} />
        <InfoRow icon={GraduationCap} label="Subjects" value={teacher.subjects?.join(", ")} />
        <div className="col-span-2 border-t pt-3.5" style={{ borderColor: C.borderLight }}>
          <InfoRow icon={Layers3} label="Grades" value={teacher.grades?.join(", ")} />
        </div>
        <div className="col-span-2">
          <InfoRow icon={BadgeCheck} label="Ranking Score" value={teacher.rankingScore ? Number(teacher.rankingScore).toFixed(1) : "Medium"} />
        </div>
        <div className="col-span-2">
          <InfoRow icon={TrendingUp} label="Avg Student Score" value={teacher.averageStudentScore ? `${teacher.averageStudentScore}%` : "Not Available"} />
        </div>

        {teacher.bio && (
          <div 
            className="col-span-2 rounded-xl p-3 text-xs leading-relaxed font-medium border"
            style={{ backgroundColor: C.bg, color: C.text, borderColor: C.borderLight }}
          >
            {teacher.bio}
          </div>
        )}
      </div>

      {/* Row Buttons Footer */}
      <div className="flex gap-2 border-t p-3 sm:p-4 bg-slate-50/50" style={{ borderColor: C.borderLight }}>
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all"
          style={{ backgroundColor: C.white, borderColor: C.border, color: C.text }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
        >
          <Pencil size={12} style={{ color: C.slate }} />
          Edit Data
        </button>

        <button
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
        >
          <Trash2 size={12} />
          Archive
        </button>
      </div>
    </div>
  );
};

export default TutorialTeacherCard;