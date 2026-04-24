// components/ProfileSidebar.jsx

import React from "react";
import { C } from "./shared.jsx";
import Avatar3D from "../../../../components/Avatar3D.jsx";

const STATUS_COLOR = {
  ACTIVE: "#16a34a",
  ON_LEAVE: "#d97706",
  RESIGNED: "#dc2626",
};

export default function TeacherSidebar({ teacher, loading }) {
  const fullName = teacher
    ? `${teacher.firstName} ${teacher.lastName || ""}`
    : "Teacher";

  const status = teacher?.status || "ACTIVE";
  const statusColor = STATUS_COLOR[status] || C.mid;

  const stats = [
    {
      label: "Exp",
      value: teacher?.experienceYears
        ? `${teacher.experienceYears} Yrs`
        : "—",
      color: "#2563eb",
    },
    {
      label: "Dept",
      value: teacher?.department || "—",
      color: "#8b5cf6",
    },
    {
      label: "Type",
      value: teacher?.employmentType || "—",
      color: "#f59e0b",
    },
    {
      label: "Status",
      value: status,
      color: statusColor,
    },
  ];

  return (
    <div className="pf-sidebar">
      <div style={{ width: "100%", height: 310 }}>
        <Avatar3D />
      </div>

      <div style={{ paddingTop: 12 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 15,
            color: C.dark,
          }}
        >
          {loading ? "Loading..." : fullName}
        </div>

        <div style={{ fontSize: 11, color: C.mid }}>
          {teacher?.designation || "Teacher"}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            fontWeight: 700,
            color: C.light,
          }}
        >
          {teacher?.employeeCode || "--"}
        </div>

        <div style={{ marginTop: 10 }}>
          <span
            className="pf-badge"
            style={{
              background: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}50`,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      <div
        className="pf-stat-grid"
        style={{ marginTop: 18, marginBottom: 10 }}
      >
        {stats.map((item) => (
          <div
            key={item.label}
            style={{
              padding: 8,
              borderRadius: 10,
              background: C.bg,
              border: `1px solid ${C.pale}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 12,
                color: item.color,
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                fontSize: 9,
                color: C.mid,
                marginTop: 2,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}