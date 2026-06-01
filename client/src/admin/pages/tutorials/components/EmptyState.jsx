import React from "react";
import { BookMarked } from "lucide-react";
import { C } from "./C"; // Import theme tokens

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center hl-fade">
      <div 
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{ 
          borderColor: C.border, 
          background: `linear-gradient(135deg, ${C.white}, ${C.bg})`,
          boxShadow: `0 4px 12px ${C.slate}15`
        }}
      >
        <BookMarked size={22} style={{ color: C.slate }} />
      </div>

      <h3 className="text-base font-extrabold" style={{ color: C.text }}>
        No tutorial teachers yet
      </h3>

      <p className="mt-1.5 max-w-xs text-xs font-medium" style={{ color: C.textLight }}>
        Add tutorial providers to set up availability rankings and recommendations.
      </p>
    </div>
  );
};

export default EmptyState;