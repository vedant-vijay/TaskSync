// ============================================
// Sidebar.jsx - Make sure online status is displayed correctly
// ============================================

import React from 'react';

export const Sidebar = ({ members = [], onlineUsers = [] }) => {
  console.log('🔍 Sidebar render');
  console.log('🔍 Members:', members);
  console.log('🔍 Online users:', onlineUsers);

  if (!Array.isArray(members) || members.length === 0) {
    return (
      <aside className="w-64 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
        <p className="text-gray-500 text-sm">No members</p>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-900 mb-4">
        Team Members ({members.length})
      </h3>
      
      <div className="space-y-3">
        {members.map(member => {
          const memberId = member._id || member.id || member.userId;
          
          // Check if this member is online
          const isOnline = onlineUsers.some(onlineUser => {
            const onlineUserId = onlineUser._id || onlineUser.id;
            const match = onlineUserId === memberId;
            
            if (match) {
              console.log(`✅ ${member.name} is ONLINE`);
            }
            
            return match;
          });

          return (
            <div 
              key={memberId} 
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
            >
              {/* Online indicator */}
              <div 
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
              
              {/* Member info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {member.email || member.role || 'Member'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Debug info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Online: {onlineUsers.length} / {members.length}
        </p>
      </div>
    </aside>
  );
};