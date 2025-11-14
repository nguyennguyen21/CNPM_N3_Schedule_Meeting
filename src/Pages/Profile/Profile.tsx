// src/components/ProfilePageWithSidebarAndProjectList.tsx
import React, { useState, useEffect } from 'react';
import Client from '../../Configs/CNAPI/CNAPI';
import type { Event } from '../types/event'; // Đảm bảo đường dẫn đúng

// --- Event Card ---
const EventCard = ({ event }: { event: Event }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const time = new Date(timeStr);
    return time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const bgColor = event.color
    ? event.color
    : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';

  return (
    <div className={`rounded-lg p-4 mb-3 border-l-4 shadow-sm ${bgColor} border-l-4`}>
      <h3 className="font-bold text-lg text-gray-800 dark:text-white">{event.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{event.description || 'Không có mô tả'}</p>

      <div className="mt-3 text-sm space-y-1">
        {event.startDate && (
          <div className="flex items-center text-gray-700 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.startDate)} {event.endDate && ` → ${formatDate(event.endDate)}`}
          </div>
        )}

        {(event.startTime || event.endTime) && (
          <div className="flex items-center text-gray-700 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(event.startTime)} {event.endTime && ` → ${formatTime(event.endTime)}`}
          </div>
        )}

        {event.location && (
          <div className="flex items-center text-gray-700 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </div>
        )}

        {event.meetingId && (
          <div className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded inline-block mt-2">
            Có cuộc họp
          </div>
        )}
      </div>
    </div>
  );
};

// --- Component chính ---
const ProfilePageWithSidebarAndProjectList = () => {
  const [user, setUser] = useState<{ id: string; username: string; fullname: string; role: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy thông tin người dùng
        const userRes = await Client.get<{
          id: string;
          username: string;
          fullname: string;
          role: string;
        }>('/api/users/me');
        const userData = userRes.data;
        setUser(userData);

        // 2. Lấy sự kiện của người dùng
        const eventsRes = await Client.get<Event[]>(`/api/events/user/${userData.id}`);
        setEvents(eventsRes.data || []);
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu profile:', err);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 pt-12">
      {/* Sidebar Profile */}
      <div className="w-80 flex-shrink-0 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 pb-6">
            <div className="text-center my-5">
              <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                {user?.fullname
                  ? user.fullname
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>
              <div className="py-3">
                <h1 className="font-bold text-2xl text-gray-800 dark:text-white">{user?.fullname}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">@{user?.username}</p>
                <div className="inline-flex items-center mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {user?.role === 'Admin' ? 'Quản trị viên' : 'Người dùng'}
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-2">
              <button className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold px-4 py-2 transition">
                Theo dõi
              </button>
              <button className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold px-4 py-2 transition">
                Nhắn tin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Event List */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Lịch sự kiện của bạn</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {events.length} sự kiện được lên lịch
              </p>
            </div>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
              + Tạo sự kiện mới
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chưa có sự kiện nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events
                .sort((a, b) => {
                  // Sắp xếp theo startDate, rồi startTime
                  const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                  const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                  if (dateA !== dateB) return dateA - dateB;
                  const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
                  const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
                  return timeA - timeB;
                })
                .map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePageWithSidebarAndProjectList;