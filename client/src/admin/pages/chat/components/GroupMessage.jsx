// src/admin/pages/chat/components/GroupMessage.jsx
import React, { useEffect, useState } from "react";
import { getToken } from "../../../../auth/storage";

const API_URL = import.meta.env.VITE_API_URL;

const GroupMessageModal = ({ onClose }) => {
  const [type, setType] = useState("TEACHER");
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");

  // fetch teachers by subject
  const fetchTeachers = async () => {
    const res = await fetch(`${API_URL}/api/teachers-by-subject`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    setSubjects(data.data || []);
  };

  // fetch classes
  const fetchClasses = async () => {
    const res = await fetch(`${API_URL}/api/class-sections`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    setClasses(data.classSections || []);
  };

  useEffect(() => {
    if (type === "TEACHER") fetchTeachers();
    else fetchClasses();
  }, [type]);

  const handleSend = async () => {
    await fetch(`${API_URL}/api/chat/group-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        userIds: selectedIds,
        message,
      }),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-[500px] rounded-xl p-5">
        <h2 className="text-lg font-bold mb-3">Group Message</h2>

        {/* Type Select */}
        <select
          className="border p-2 w-full mb-3"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="TEACHER">Teachers (Subject)</option>
          <option value="STUDENT">Students (Class)</option>
        </select>

        {/* Teacher Subject */}
      {type === "TEACHER" && (
        <div className="max-h-48 overflow-y-auto border p-2">
          {subjects.map((s) => (
            <div key={s.subjectId} className="mb-2 border-b pb-2">

              {/* SUBJECT HEADER */}
              <div className="font-semibold flex justify-between">
                <span>{s.subjectName}</span>
                <span className="text-sm text-gray-500">
                  {s.count} teachers
                </span>
              </div>

              {/* SELECT ALL */}
              <label className="text-sm">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(prev => [
                        ...new Set([...prev, ...s.teachers.map(t => t.id)])
                      ]);
                    } else {
                      setSelectedIds(prev =>
                        prev.filter(id => !s.teachers.map(t => t.id).includes(id))
                      );
                    }
                  }}
                />
                Select All
              </label>

              {/* TEACHERS LIST */}
              {s.teachers.map((t) => (
                <label key={t.id} className="block ml-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) => {
                      setSelectedIds(prev =>
                        e.target.checked
                          ? [...prev, t.id]
                          : prev.filter(id => id !== t.id)
                      );
                    }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

        {/* Student Class */}
        {type === "STUDENT" && (
          <div className="max-h-40 overflow-y-auto border p-2">
            {classes.map((c) => (
              <label key={c.id} className="block">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelectedIds((prev) =>
                      e.target.checked
                        ? [...prev, c.id]
                        : prev.filter((id) => id !== c.id)
                    )
                  }
                />
                {c.name} ({c._count?.studentEnrollments || 0} students)
              </label>
            ))}
          </div>
        )}

        {/* Message */}
        <textarea
          className="w-full border p-2 mt-3"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose}>Cancel</button>
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMessageModal;