import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const { user, login, register, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ ONLY navigate AFTER user exists
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleRegister = async (formData) => {
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
    } catch (err) {
      console.error('Register failed:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Checking authentication...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isRegister ? 'Join your team today' : 'Sign in to your account'}
          </p>
        </div>

        {isRegister ? (
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={() => setIsRegister(false)}
          />
        ) : (
          <LoginForm
            onSubmit={handleLogin}
            onSwitchToRegister={() => setIsRegister(true)}
          />
        )}
      </div>
    </div>
  );
};
