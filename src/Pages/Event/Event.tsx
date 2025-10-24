// src/Pages/Events/EventPage.tsx
import { useState, useEffect } from 'react';
import EventList from "../../Modules/Events/Components/EventList";
import WeeklyCalendar from '../../Modules/Calander/Calender';

export const EventPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy userId từ localStorage (được lưu khi đăng nhập)
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Nếu chưa đăng nhập, chuyển hướng về trang login
      window.location.href = '/login';
      return;
    }

    setLoading(false);
  }, []);

  if (loading || !userId) {
    return <div className="p-10">Đang tải...</div>;
  }

  return (
    <>
      <EventList userId={userId} />
      <WeeklyCalendar/>
    </>
  );
};