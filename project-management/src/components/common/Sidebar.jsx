import React from 'react';
import { Users } from 'lucide-react';
import { OnlineIndicator } from './OnlineIndicator';
import { USER_ROLE } from '../../utils/constants';

export const Sidebar = ({ members, onlineUsers }) => {
  return (
    <aside className="w-64 bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Team Members</h3>
        <span className="text-sm text-gray-500">({members.length})</span>
      </div>
      
      <div className="space-y-2">
        {members.map(member => {
          const isOnline = onlineUsers.some(u => u.id === member.id);
          return (
            <div key={member.id} className="flex items-center gap-2 py-2">
              <OnlineIndicator isOnline={isOnline} />
              <span className="text-sm text-gray-700 flex-1">{member.name}</span>
              {member.role === USER_ROLE.LEADER && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Leader
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};