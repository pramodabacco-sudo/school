import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("auth"));
      if (!stored) return null;
      return {
        name: stored.user?.name,
        email: stored.user?.email,
        role: stored.user?.role || stored.role,
        accountType: stored.accountType,
      };
    } catch (err) {
      console.error("Invalid auth in localStorage");
      return null;
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default PageLayout;