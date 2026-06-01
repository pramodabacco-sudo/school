import React from "react";
import { C } from "./C";

const LoadingGrid = () => {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border p-5"
          style={{ 
            borderColor: C.borderLight, 
            backgroundColor: C.white,
            boxShadow: `0 2px 12px ${C.slate}05`
          }}
        >
          <div className="flex gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl" style={{ backgroundColor: `${C.mist}44` }} />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 w-1/2 rounded" style={{ backgroundColor: `${C.mist}44` }} />
              <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: `${C.mist}33` }} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-6 rounded-lg" style={{ backgroundColor: `${C.bg}bb` }} />
            <div className="h-6 rounded-lg" style={{ backgroundColor: `${C.bg}bb` }} />
            <div className="h-6 rounded-lg" style={{ backgroundColor: `${C.bg}bb` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingGrid;