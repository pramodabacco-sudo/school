// src/admin/pages/chat/ChatPage.jsx
import React, { useState, useEffect } from "react";
import ChatList from "./components/ChatList";
import MessageView from "./components/MessageView";

const API_URL = import.meta.env.VITE_API_URL;

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  const handleChatCreated = (chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  useEffect(() => {
  if (!selectedChat?.id) return;

  // 🔥 mark messages as seen
  fetch(`${API_URL}/api/chat/mark-seen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ chatRoomId: selectedChat.id }),
  });

  // 🔥 notify Navbar to remove notification
  window.dispatchEvent(
    new CustomEvent("chat_opened", {
      detail: { chatRoomId: selectedChat.id },
    })
  );
}, [selectedChat]);

  // On mobile: show list OR message view (not both)
  // On desktop (sm+): show both side by side
  return (
    <div className="flex h-[92dvh] bg-blue-50 font-['DM_Sans'] overflow-hidden">
      {/* Chat List: always visible on desktop, hidden on mobile when chat selected */}
      <div className={`
        ${selectedChat ? "hidden sm:flex" : "flex"}
        w-full sm:w-80 sm:min-w-[300px]
      `}>
        <ChatList 
          selectedChat={selectedChat} 
          onSelectChat={handleSelectChat}
          onChatCreated={handleChatCreated}
        />
      </div>

      {/* Message View: always visible on desktop, shown on mobile when chat selected */}
      <div className={`
        ${selectedChat ? "flex" : "hidden sm:flex"}
        flex-1 min-w-0
      `}>
        <MessageView 
          selectedChat={selectedChat}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default ChatPage;