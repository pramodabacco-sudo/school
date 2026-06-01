import React from "react";
import { C } from "./C";

const InfoRow = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 py-1">
      <div 
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-slate-500"
        style={{ backgroundColor: C.bg, borderColor: C.borderLight }}
      >
        <Icon size={13} style={{ color: C.text }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textLight }}>
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs font-semibold" style={{ color: C.text }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
};

export default InfoRow;