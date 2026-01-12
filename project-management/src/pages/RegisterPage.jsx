import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage = () => {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ unified navigation logic
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async (formData) => {
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
    } catch (err) {
      console.error('Register failed', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Creating account...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <RegisterForm
          onSubmit={handleRegister}
          onSwitchToLogin={() => navigate('/login')}
        />
      </div>
    </div>
  );
};
