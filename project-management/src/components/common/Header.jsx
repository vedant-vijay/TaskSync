import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Header = ({ title, showBack = false, onBack }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                ← Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User size={20} />
              <span>{user?.name}</span>
              {user?.role && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};