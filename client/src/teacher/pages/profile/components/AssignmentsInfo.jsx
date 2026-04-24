// components/AssignmentsInfo.jsx

import React from "react";
import { BookOpen } from "lucide-react";

import {
  SectionHeading,
  Loading,
  ErrorMsg,
  Empty,
  C,
} from "./shared.jsx";

export default function AssignmentsInfo({
  teacher,
  loading,
  error,
}) {
  if (loading) return <Loading />;
  if (error) return <ErrorMsg msg={error} />;

  const list = teacher?.assignments || [];

  if (!list.length)
    return <Empty message="No assignments found." />;

  return (
    <div>
      <SectionHeading
        icon={BookOpen}
        title="Assignments"
      />

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {list.map((item) => (
          <div
            key={item.id}
            className="pf-info-card"
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: C.dark,
                  fontSize: 13,
                }}
              >
                {item.subject?.name}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: C.mid,
                  marginTop: 4,
                }}
              >
                {item.classSection?.name} ·{" "}
                {item.academicYear?.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}