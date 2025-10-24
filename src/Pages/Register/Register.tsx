import { useNavigate } from 'react-router-dom'
// pages/RegisterPage.tsx

import { useState } from 'react';
import axios from 'axios';
import { registerUser } from '../../Modules/Auth/Services/Auth';
import type { CreateUserRequest, ApiError } from '../../Modules/Auth/Types/Auth';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    fullname: '',
    password: '',
    role: 'student', // mặc định
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (serverError) setServerError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required.';
    if (!formData.username.trim()) newErrors.username = 'Username is required.';
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      await registerUser(formData);
      alert('Registration successful! Redirecting to login...');
       navigate('/auth/login')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as ApiError | undefined;
        setServerError(apiError?.message || 'Registration failed. Please try again.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="p-10">
      <h1 className="mb-8 font-extrabold text-4xl">Register</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block font-semibold">Full Name</label>
            <input
              className={`w-full shadow-inner bg-gray-100 rounded-lg placeholder-black text-2xl p-4 border-none mt-1 ${
                errors.fullname ? 'border-red-500 border-2' : ''
              }`}
              id="fullname"
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
            />
            {errors.fullname && (
              <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block font-semibold">Username</label>
            <input
              className={`w-full shadow-inner bg-gray-100 rounded-lg placeholder-black text-2xl p-4 border-none mt-1 ${
                errors.username ? 'border-red-500 border-2' : ''
              }`}
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block font-semibold">Password</label>
            <input
              className={`w-full shadow-inner bg-gray-100 rounded-lg placeholder-black text-2xl p-4 border-none mt-1 ${
                errors.password ? 'border-red-500 border-2' : ''
              }`}
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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
              Register
            </button>
            <a href="/login" className="font-semibold text-blue-600 hover:underline">
              Already registered?
            </a>
          </div>
        </form>

        <aside>
          <div className="bg-gray-100 p-8 rounded">
            <h2 className="font-bold text-2xl">Instructions</h2>
            <ul className="list-disc mt-4 list-inside space-y-2">
              <li>Full name and username must not be empty.</li>
              <li>Username must be unique.</li>
              <li>Password must be at least 6 characters long.</li>
              <li>Choose your role carefully (default: Student).</li>
            </ul>

            {/* Hiển thị lỗi server */}
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