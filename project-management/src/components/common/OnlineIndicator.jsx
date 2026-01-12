import React from 'react';

export const OnlineIndicator = ({ isOnline, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'} ${sizeClasses[size]}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
};
