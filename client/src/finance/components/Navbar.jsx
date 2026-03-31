// client/src/finance/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Mail,
  Menu,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import LogoutButton from "../../components/LogoutButton";

const font = { fontFamily: "'DM Sans', sans-serif" };

const initials = (name = "AU") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function Navbar({ onMenuClick, user }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const displayName = user?.name || "Admin User";
  const displayRole = user?.role || "Administrator";
  const displayEmail = user?.email || "";

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (
        mobileSearchOpen &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      )
        setMobileSearchOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [mobileSearchOpen]);

  return (
    <>
      {/* ── Mobile search drawer ── */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="sm:hidden fixed top-16 left-0 right-0 z-40 px-4 py-3"
          style={{
            background: "#fff",
            borderBottom: "1.5px solid #e8f1fb",
            boxShadow: "0 4px 12px rgba(56,73,89,0.08)",
          }}
        >
          <div className="relative flex items-center">
            <Search
              size={15}
              className="absolute left-3 pointer-events-none"
              style={{ color: "#6A89A7" }}
            />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students, teachers…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
              style={{
                border: "1.5px solid #88BDF2",
                background: "#f8fbff",
                color: "#384959",
                boxShadow: "0 0 0 3px rgba(136,189,242,0.15)",
                ...font,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-6"
        style={{
          background: "#fff",
          borderBottom: "1.5px solid #e8f1fb",
          boxShadow: "0 1px 6px rgba(56,73,89,0.05)",
          ...font,
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hamburger — mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{
              color: "#6A89A7",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f8fd")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Menu size={20} />
          </button>

          {/* Search bar — tablet + desktop */}
          <div className="relative hidden sm:flex items-center">
            <Search
              size={15}
              className="absolute left-3 pointer-events-none"
              style={{ color: "#6A89A7" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students, teachers…"
              className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none w-52 md:w-72 lg:w-96 transition-all"
              style={{
                border: "1.5px solid #BDDDFC",
                background: "#f8fbff",
                color: "#384959",
                ...font,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#88BDF2";
                e.target.style.boxShadow = "0 0 0 3px rgba(136,189,242,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#BDDDFC";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mobile search toggle */}
          <button
            className="sm:hidden p-2 rounded-xl transition-colors"
            style={{
              color: mobileSearchOpen ? "#88BDF2" : "#6A89A7",
              background: mobileSearchOpen ? "#f3f8fd" : "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setMobileSearchOpen((o) => !o)}
          >
            <Search size={18} />
          </button>

          {/* Mail */}
          <button
            className="relative p-2 rounded-xl transition-colors"
            style={{
              color: "#6A89A7",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f8fd")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Mail size={19} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: "#88BDF2" }}
            />
          </button>

          {/* Bell */}
          <button
            className="relative p-2 rounded-xl transition-colors"
            style={{
              color: "#6A89A7",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f8fd")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Bell size={19} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: "#ef4444" }}
            />
          </button>

          {/* Divider — hide on very small screens */}
          <div
            className="hidden xs:block w-px h-7 mx-1 sm:mx-2"
            style={{ background: "#BDDDFC" }}
          />

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 sm:gap-2.5 px-1.5 sm:px-2 py-1.5 rounded-xl transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f3f8fd")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Name — desktop only */}
              <div className="hidden md:block text-right">
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: "#384959" }}
                >
                  {displayName}
                </p>
                <p className="text-[11px]" style={{ color: "#6A89A7" }}>
                  {displayRole}
                </p>
                {displayEmail && (
                  <p
                    className="text-[10px] truncate max-w-[140px]"
                    style={{ color: "#88BDF2" }}
                  >
                    {displayEmail}
                  </p>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #88BDF2, #6A89A7)",
                  color: "#fff",
                }}
              >
                {initials(displayName)}
              </div>

              <ChevronDown
                size={14}
                className={`hidden md:block transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                  }`}
                style={{ color: "#6A89A7" }}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-xl overflow-hidden py-1"
                style={{
                  background: "#fff",
                  border: "1.5px solid #BDDDFC",
                  boxShadow: "0 8px 28px rgba(56,73,89,0.13)",
                  zIndex: 60,
                }}
              >
                {/* User mini-card */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3 mb-1"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #88BDF2, #6A89A7)",
                      color: "#fff",
                    }}
                  >
                    {initials(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "#384959" }}
                    >
                      {displayName}
                    </p>
                    <p
                      className="text-[10px] truncate"
                      style={{ color: "#6A89A7" }}
                    >
                      {displayRole}
                    </p>
                    {displayEmail && (
                      <p
                        className="text-[10px] truncate"
                        style={{ color: "#88BDF2" }}
                      >
                        {displayEmail}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: "#384959",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    ...font,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f3f8fd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <User size={15} style={{ color: "#6A89A7" }} />
                  Profile
                </button>

                <div
                  style={{ borderTop: "1px solid #f1f5f9", margin: "2px 0" }}
                />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setLogoutModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    ...font,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#fff5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Logout Modal ── */}
      {logoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(56,73,89,0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 sm:p-6"
            style={{
              background: "#fff",
              boxShadow: "0 24px 64px rgba(56,73,89,0.22)",
              animation: "popIn .18s ease",
              ...font,
            }}
          >
            <style>{`@keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>

            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#fee2e2" }}
            >
              <LogOut size={19} style={{ color: "#ef4444" }} />
            </div>

            <h3
              className="text-base font-bold text-center mb-1"
              style={{ color: "#384959" }}
            >
              Confirm Logout
            </h3>
            <p
              className="text-sm text-center mb-5 sm:mb-6"
              style={{ color: "#6A89A7" }}
            >
              Are you sure you want to logout? You'll need to sign in again.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  border: "1.5px solid #BDDDFC",
                  background: "#f8fbff",
                  color: "#384959",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#BDDDFC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f8fbff")
                }
              >
                Cancel
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}