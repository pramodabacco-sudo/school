import { useState, useEffect } from "react";
import { getMyProfile, getParentStudents } from "./components/api";
import { getAuth } from "../../../auth/storage"; // adjust path as needed

const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "academic", label: "Document Info" },
    { id: "health", label: "Health" },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ type }) => {
    const icons = {
        id: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2M15 12h2M7 16h10" />
            </svg>
        ),
        person: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
        ),
        calendar: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
        parent: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="9" cy="7" r="3" />
                <circle cx="17" cy="7" r="3" />
                <path d="M2 20c0-3 3-5 7-5s7 2 7 5M14 20c0-2 2-4 5-4" />
            </svg>
        ),
        phone: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L9.1 11a16 16 0 0 0 6.9 6.9l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 24 18.9z" />
            </svg>
        ),
        email: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 7L2 7" />
            </svg>
        ),
        location: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
                <circle cx="12" cy="9" r="2.5" />
            </svg>
        ),
        book: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
        trophy: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
                <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
                <path d="M12 17v4" />
                <path d="M8 21h8" />
                <path d="M6 5h12v6a6 6 0 0 1-12 0V5z" />
            </svg>
        ),
    };
    return icons[type] || icons.person;
};

// ── Info Card (field tile) ────────────────────────────────────────────────────
const InfoCard = ({ label, value, iconType, fullWidth = false }) => (
    <div className={`bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3 ${fullWidth ? "col-span-2" : ""}`}>
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            <Icon type={iconType} />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{value || "—"}</p>
        </div>
    </div>
);

// ── Single student profile card ───────────────────────────────────────────────
const StudentCard = ({ student }) => {
    const [activeTab, setActiveTab] = useState("personal");
    const p = student.personalInfo || {};

    return (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg bg-white">
            {/* ── Top Banner ── */}
            <div
                className="flex items-center justify-between px-6 py-3"
                style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)" }}
            >
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Icon type="trophy" />
                    <span>Class Rank {p.classRank || "—"}</span>
                </div>
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-blue-800 text-white border border-white"
                                : "bg-white text-blue-700 hover:bg-blue-50"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex gap-0 bg-gray-50 min-h-96">
                {/* ── Left Panel ── */}
                <div className="w-72 flex-shrink-0 flex flex-col items-center pt-8 pb-6 px-6 border-r border-gray-200 bg-white">
                    {/* Avatar */}
                    <div className="relative mb-4">
                        <div className="w-36 h-36 rounded-full border-4 border-blue-200 overflow-hidden bg-blue-50 flex items-center justify-center">
                            {p.profileImage ? (
                                <img src={p.profileImage} alt="profile" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/8030/8030035.png"
                                        alt="Student"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                    <span className="text-6xl" style={{ display: "none" }}>🧑‍🎒</span>
                                </>
                            )}
                        </div>
                        {/* Camera button */}
                        <button className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow border border-gray-200 hover:bg-gray-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </button>
                    </div>

                    {/* Name & info */}
                    <h2 className="text-lg font-bold text-gray-800 text-center">
                        {`${p.firstName || ""} ${p.lastName || ""}`.trim() || student.name || "—"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {p.grade && p.className ? `Grade ${p.grade} - Section ${p.className}` : p.grade || p.className || "—"}
                    </p>
                    <p className="text-sm text-blue-600 font-medium mt-0.5">
                        {student.rollNumber || "—"}
                    </p>

                    {/* Badges */}
                    <div className="flex gap-2 mt-3 flex-wrap justify-center">
                        {p.status && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                {p.status}
                            </span>
                        )}
                        {p.honorRoll && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                Honor Roll
                            </span>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-5 w-full">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <p>{student.attendance || "0"}</p>
                            <p className="text-xs text-gray-500">Attendance</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-purple-600">{p.gpa || "—"}</p>
                            <p>{student.gpa || "0.0"}</p>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-pink-600">{p.subjects || "—"}</p>
                            <p>{student.subjects || "0"}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-orange-500">{p.activities || "—"}</p>
                            <p>{student.activities || "0"}</p>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="flex-1 p-6">
                    {/* ── Personal Info ── */}
                    {activeTab === "personal" && (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                                <Icon type="book" />
                                Personal Information
                            </h2>
                            <hr className="border-blue-200 mb-4" />
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard label="Full Name" value={`${p.firstName || ""} ${p.lastName || ""}`.trim()} iconType="person" />
                                <InfoCard
                                    label="Admission & Roll Number"
                                    value={`${student.admissionNumber || student.id} / ${student.rollNumber}`}
                                    iconType="id"
                                />
                                <InfoCard label="Date of Birth" value={p.dateOfBirth?.slice(0, 10)} iconType="calendar" />
                                <InfoCard label="Father's Name" value={p.parentName} iconType="parent" />
                                {p.motherName && (
                                    <InfoCard
                                        label="Mother's Name"
                                        value={p.motherName}
                                        iconType="parent"
                                    />
                                )}
                                <InfoCard label="Mobile Number" value={p.phone} iconType="phone" />
                                <InfoCard label="Email Address" value={student.email} iconType="email" fullWidth />
                                <InfoCard label="Current Address" value={p.address} iconType="location" fullWidth />
                                {p.permanentAddress && (
                                    <InfoCard
                                        label="Permanent Address"
                                        value={p.permanentAddress}
                                        iconType="location"
                                        fullWidth
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Document Info ── */}
                    {activeTab === "academic" && (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                                <Icon type="book" />
                                Document Information
                            </h2>
                            <hr className="border-blue-200 mb-4" />
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard label="Class" value={p.grade} iconType="book" />
                                <InfoCard label="Section" value={p.className} iconType="book" />
                                <InfoCard label="Roll Number" value={p.rollNumber} iconType="id" />
                                <InfoCard label="Admission Date" value={p.admissionDate?.slice(0, 10)} iconType="calendar" />
                                <InfoCard label="Status" value={p.status} iconType="person" />
                            </div>
                        </>
                    )}

                    {/* ── Health ── */}
                    {activeTab === "health" && (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                                <Icon type="book" />
                                Health Information
                            </h2>
                            <hr className="border-blue-200 mb-4" />
                            <div className="grid grid-cols-2 gap-3">
                                <InfoCard label="Blood Group" value={p.bloodGroup} iconType="person" />
                                <InfoCard label="Allergies" value={p.allergies} iconType="person" />
                                <InfoCard label="Medical Conditions" value={p.medicalConditions} iconType="person" fullWidth />
                                <InfoCard label="Emergency Contact" value={p.emergencyContact} iconType="phone" fullWidth />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
const Profile = () => {
    const [students, setStudents] = useState([]); // always an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Which child is selected (for parent with multiple students)
    const [selectedIdx, setSelectedIdx] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const auth = getAuth();
                const userType = auth?.accountType;

                if (userType === "parent") {
                    const students = await getParentStudents();
                    setStudents(students || []);
                } else {
                    const res = await getMyProfile(auth?.token);
                    setStudents(res ? [res] : []);
                }

            } catch (err) {
                console.error(err.message);
                setError("Failed to load profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);
    if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!students.length) return <div className="p-6 text-center text-gray-500">No student data found.</div>;

    const isParentWithMultiple = students.length > 1;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">

            {/* ── Child Switcher (only shown when parent has multiple children) ── */}
            {isParentWithMultiple && (
                <div className="mb-6 flex gap-3 flex-wrap">
                    {students.map((s, idx) => {
                        const p = s.personalInfo;
                        const label = p
                            ? `${p.firstName} ${p.lastName}`
                            : s.name;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSelectedIdx(idx)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 ${selectedIdx === idx
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-blue-600 border-blue-300 hover:border-blue-500"
                                    }`}
                            >
                                {label}
                                {p?.grade && (
                                    <span className="ml-2 text-xs opacity-75">
                                        Gr. {p.grade}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Student Profile Card ── */}
            <StudentCard student={students[selectedIdx]} />
        </div>
    );
};

export default Profile;