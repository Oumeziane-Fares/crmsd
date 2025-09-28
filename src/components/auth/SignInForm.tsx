import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SignInForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const API_URL = 'http://localhost/crmsd/finances-old/action.php';
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('login_email', email);
    formData.append('login_password', password);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }

      const data = await response.json();

      if (data.error && data.error !== '') {
        const cleanedError = data.error.replace(/<[^>]*>?/gm, '');
        setError(cleanedError);
      } else {
        const userData = {
          id: data.finances_id,
          fullName: `${data.finances_nom} ${data.finances_prenom}`,
          email: data.finances_email,
        };
        login(userData);
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full lg:w-1/2">
      <div className="w-full max-w-md p-6 mx-auto sm:p-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <img
              className="dark:hidden"
              src="/images/logo/logo-2.png" // Santedom Logo
              alt="Logo"
              width={170}
            />
            <img
              className="hidden dark:block"
              src="/images/logo/logo-2.png" // Santedom Logo
              alt="Logo"
              width={170}
            />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Sign in to Santedom
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 mb-4 text-sm text-center text-red-800 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-900 dark:text-white">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-gray-900 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium text-gray-900 dark:text-white">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-gray-900 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInForm;