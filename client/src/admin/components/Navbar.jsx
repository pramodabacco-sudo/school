import React from 'react';
import { Search, Bell, Menu, Mail, ChevronDown } from 'lucide-react';
import LogoutButton from '../../components/LogoutButton';

function Navbar({ onMenuClick }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 border-b">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students, teachers..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Icon for Mobile */}
          <button className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {/* Messages */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l">
            <div className="text-right hidden md:block">
              <p className="font-semibold text-sm text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded-lg transition">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                AU
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
              <LogoutButton/>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;