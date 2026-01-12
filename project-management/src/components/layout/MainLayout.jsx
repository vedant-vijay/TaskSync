import react from 'react';
import { Header } from '../common/Header';

export const MainLayout = ({ children, title, showBack = false, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};