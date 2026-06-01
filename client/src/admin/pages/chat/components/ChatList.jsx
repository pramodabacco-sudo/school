// src/admin/pages/chat/components/ChatList.jsx
import React, { useState, useEffect } from "react";
import { getToken, getUser } from "../../../../auth/storage";
import GroupMessageModal from "./GroupMessage";

const API_URL = import.meta.env.VITE_API_URL;

const TABS = ["SUPER_ADMIN", "TEACHER", "FINANCE", "PARENT"];

const COLORS = ["#384959", "#6A89A7", "#88BDF2", "#BDDDFC", "#5a7a94"];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ name = "", size = 42, colorIndex = 0 }) {
  const bg = COLORS[colorIndex % COLORS.length];
  const textColor = colorIndex <= 1 ? "#BDDDFC" : "#384959";
  return (
    <div
      className="flex items-center justify-center font-semibold rounded-full"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: bg,
        color: textColor,
        fontSize: size * 0.33,
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role = "" }) {
  return (
    <span className="inline-block text-xs font-semibold bg-blue-200 text-blue-700 rounded-full px-2 py-0.5 mt-0.5 font-['DM_Sans']">
      {role.replace("_", " ")}
    </span>
  );
}

const ChatList = ({ selectedChat, onSelectChat, onChatCreated }) => {
  const [chatList, setChatList] = useState([]);
  const [search, setSearch] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("SUPER_ADMIN");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [openMenuChatId, setOpenMenuChatId] = useState(null);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/list`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setChatList(
        (data.data || []).sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt
            ? new Date(a.messages[0].createdAt).getTime()
            : 0;
          const bTime = b.messages?.[0]?.createdAt
            ? new Date(b.messages[0].createdAt).getTime()
            : 0;
          return bTime - aTime;
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (role) => {
    try {
      const res = await fetch(`${API_URL}/api/chat?role=${role}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createChat = async (userId, role) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ receiverId: userId, receiverRole: role }),
      });
      const data = await res.json();
      onChatCreated(data.data);
      setShowUserList(false);
      fetchChats();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/chat/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed to delete chat");
        return;
      }

      setChatList((prev) => prev.filter((chat) => chat.id !== chatId));

      const remainingChats = chatList.filter((c) => c.id !== chatId);

      if (selectedChat?.id === chatId) {
        if (remainingChats.length > 0) {
          onSelectChat(remainingChats[0]);
        } else {
          onSelectChat(null);
        }
      }

      setShowDeleteModal(false);
      setChatToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete chat");
    }
  };

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    const refreshUnread = () => fetchChats();
    window.addEventListener("chat_opened", refreshUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("chat_opened", refreshUnread);
    };
  }, []);

  const filteredChats = chatList
    .filter((c) => c.otherUser?.role !== "STUDENT")
    .filter((c) =>
      (c.otherUser?.name || "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <div className="flex flex-col w-80 min-w-[300px] bg-white border-r-[1.5px] border-blue-200 h-[92dvh]">

        {/* Header */}
        <div className="bg-slate-700 p-4 flex items-center justify-between gap-2">
          <h2 className="text-white text-lg font-semibold tracking-tight flex-1">
            Messages
          </h2>

          <button
            onClick={() => {
              setShowUserList(false);
              setShowGroupModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors font-['DM_Sans']"
            style={{
              background: "rgba(136,189,242,0.18)",
              color: "#BDDDFC",
              border: "1px solid rgba(189,221,252,0.35)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            title="Send group message to students"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Group
          </button>

          <button
            className="bg-blue-300 text-slate-700 border-none rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer font-['DM_Sans'] whitespace-nowrap"
            onClick={() => {
              setShowUserList(true);
              fetchUsers("SUPER_ADMIN");
              setActiveTab("SUPER_ADMIN");
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-blue-200">
          <input
            className="w-full border border-blue-200 rounded-full px-3.5 py-2 text-sm text-slate-700 bg-blue-50 outline-none font-['DM_Sans'] box-border"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role tabs */}
        {showUserList && (
          <div className="flex gap-1.5 p-2.5 border-b border-blue-200 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-none font-['DM_Sans'] whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-slate-700 text-white"
                    : "bg-blue-200 text-blue-700"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  fetchUsers(tab);
                }}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        )}

        {/* List body */}
        <div className="flex-1 overflow-y-auto">
          {showUserList ? (
            users.map((u, i) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3.5 cursor-pointer border-b border-gray-100 hover:bg-blue-100 transition-colors"
                onClick={() => {
                  if (activeTab === "STUDENT") {
                    alert("Cannot create chat with students.");
                    return;
                  }
                  createChat(u.id, activeTab);
                }}
              >
                <Avatar name={u.name} size={42} colorIndex={i % 5} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 truncate">
                      {u.name}
                    </span>
                  </div>
                  <RoleBadge role={activeTab} />
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {u.email}
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredChats.map((chat, i) => {
              const isActive = selectedChat?.id === chat.id;
              return (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer border-b border-gray-100 transition-colors ${
                    isActive ? "bg-blue-200" : "hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    onSelectChat(chat);
                    setChatList((prev) =>
                      prev.map((c) =>
                        c.id === chat.id ? { ...c, unreadCount: 0 } : c
                      )
                    );
                  }}
                >
                  <Avatar
                    name={chat.otherUser?.name || "?"}
                    size={42}
                    colorIndex={i % 5}
                  />

                  {/* ── redesigned info block ── */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: name left | time + menu right */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-slate-700 truncate flex-1">
                        {chat.otherUser?.name || "Unknown"}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0 relative">
                        <span className="text-xs text-blue-700">
                          {chat.messages?.[0]?.createdAt
                            ? new Date(chat.messages[0].createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuChatId(
                              openMenuChatId === chat.id ? null : chat.id
                            );
                          }}
                          className="text-gray-400 hover:text-gray-600 px-1 leading-none"
                        >
                          ⋮
                        </button>
                        {openMenuChatId === chat.id && (
                          <div className="absolute right-0 top-6 bg-white shadow-lg border border-gray-100 rounded-lg z-50 min-w-[130px]">
                            <button
                              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToDelete(chat);
                                setShowDeleteModal(true);
                                setOpenMenuChatId(null);
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                              </svg>
                              Delete Chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: role badge */}
                    <RoleBadge role={chat.otherUser?.role || ""} />

                    {/* Row 3: last message */}
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {chat.messages?.[0]?.content || "No messages yet"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Group Message Modal */}
      {showGroupModal && (
        <GroupMessageModal onClose={() => setShowGroupModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[360px] max-w-[90%] overflow-hidden">
            {/* Red top bar */}
            <div className="bg-red-500 px-5 py-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-base">Delete Conversation</h3>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                You're about to permanently delete your conversation with{" "}
                <span className="font-semibold text-slate-700">
                  {chatToDelete?.otherUser?.name}
                </span>
                . This cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteChat(chatToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatList;