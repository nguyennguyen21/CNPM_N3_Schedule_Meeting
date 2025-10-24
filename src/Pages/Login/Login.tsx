// src/Pages/Login/Login.tsx

import { useState } from 'react';
import axios from 'axios';
import { loginUser } from '../../Modules/Auth/Services/Auth';
import type { LoginRequest, ApiError } from '../../Modules/Auth/Types/Auth';
import { useNavigate } from 'react-router-dom';
export const LoginPage = () => {
  
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    // Xóa lỗi của field khi người dùng nhập lại
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Xóa lỗi server khi nhập lại
    if (serverError) setServerError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required.';
    }
    if (!credentials.password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      const response = await loginUser(credentials);
      
      // ✅ LƯU CẢ userId (bắt buộc cho EventList)
      localStorage.setItem('token', response.token!);
      localStorage.setItem('userId', response.id); // 👈 THÊM DÒNG NÀY

      // ✅ DÙNG navigate() THAY VÌ window.location
      navigate('/intro'); // hoặc '/dashboard' — nhưng phải có route này!
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as ApiError | undefined;
        setServerError(apiError?.message || 'Invalid username or password.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="p-10">
      <h1 className="mb-8 font-extrabold text-4xl">Login</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block font-semibold">Username</label>
            <input
              className={`w-full shadow-inner bg-gray-100 rounded-lg placeholder-black text-2xl p-4 border-none mt-1 ${
                errors.username ? 'border-2 border-red-500' : ''
              }`}
              id="username"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block font-semibold">Password</label>
            <input
              className={`w-full shadow-inner bg-gray-100 rounded-lg placeholder-black text-2xl p-4 border-none mt-1 ${
                errors.password ? 'border-2 border-red-500' : ''
              }`}
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="submit"
              className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-second hover:bg-primary md:py-4 md:text-lg md:px-10"
            >
              Login
            </button>
            <a href="/register" className="font-semibold text-blue-600 hover:underline">
              Don't have an account?
            </a>
          </div>
        </form>

        <aside>
          <div className="bg-gray-100 p-8 rounded">
            <h2 className="font-bold text-2xl">Instructions</h2>
            <ul className="list-disc mt-4 list-inside space-y-2">
              <li>Enter the exact username you used during registration.</li>
              <li>Usernames are case-sensitive.</li>
              <li>Password must be at least 6 characters.</li>
            </ul>

            {/* Hiển thị lỗi từ server */}
            {serverError && (
              <div className="mt-6 p-3 bg-red-100 text-red-700 rounded border border-red-300">
                <strong>Error:</strong> {serverError}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};