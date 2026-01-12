import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';

export const AddMemberModal = ({ projectId, existingMembers = [], onClose, onSuccess }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('MEMBER');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setError('');
    setSearchResult(null);

    try {
      const user = await userService.searchByEmail(searchEmail.trim());
      
      if (!user) {
        setError('User not found');
        return;
      }

      // Check if already a member
      const isExisting = existingMembers.some(m => 
        (m._id || m.id) === (user._id || user.id)
      );

      if (isExisting) {
        setError('User is already a member of this project');
        return;
      }

      setSearchResult(user);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchResult) return;

    setAdding(true);
    setError('');

    try {
      const userId = searchResult._id || searchResult.id;
      await projectService.addMember(projectId, userId, role);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Add member error:', err);
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Add Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                placeholder="user@example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searching || adding}
              />
              <button
                onClick={handleSearch}
                disabled={searching || adding || !searchEmail.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={20} />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Search Result */}
          {searchResult && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{searchResult.name}</p>
                  <p className="text-sm text-gray-600">{searchResult.email}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={adding}
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEADER">Leader</option>
                </select>
              </div>

              <button
                onClick={handleAddMember}
                disabled={adding}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {adding ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          )}

          {/* Instructions */}
          {!searchResult && !error && (
            <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-900 mb-1">How to add members:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter the user's email address</li>
                <li>Click Search to find the user</li>
                <li>Select their role (Member or Leader)</li>
                <li>Click "Add to Project"</li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={adding}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};