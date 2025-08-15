'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/services/auth';
import {
  MessageSquare,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';

export function DashboardNavigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // **NEW: Auth loading state**

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // **CHANGED: Don't redirect here, let the page handle it**
        // router.push('/login');
      } finally {
        setAuthLoading(false); // **NEW: Set loading complete**
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => { // **CHANGED: Make async**
    await authService.logout();
    router.push('/');
  };

  // **NEW: Don't render navigation if auth is loading**
  if (authLoading) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="relative">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">ReviewsAI</span>
          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Dashboard</span>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.username || 'Loading...'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email || ''}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>

                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Profile Settings</span>
                </button>

                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Account Settings</span>
                </button>

                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
}