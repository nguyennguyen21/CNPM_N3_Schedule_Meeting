// src/Pages/Events/EventPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Thêm useNavigate
import EventList from "../../Modules/Events/Components/EventList";
import WeeklyCalendar from '../../Modules/Calander/Calender';

export const EventPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate(); // 👈

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    
    if (!storedUserId) {
      navigate('/login', { replace: true }); // 👈 Điều hướng an toàn
      return;
    }

    setUserId(storedUserId);
    setLoading(false);
  }, [navigate]); // 👈 Thêm navigate vào deps

  const handleEventChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading || !userId) {
    return <div className="p-10">Đang tải...</div>;
  }

  return (
    <>
      <EventList 
        userId={userId} 
        key={`event-list-${refreshKey}`} 
        onEventChange={handleEventChange} // 👈 Truyền callback nếu cần
      />
      <WeeklyCalendar 
        key={`weekly-calendar-${refreshKey}`} 
        userId={userId} // 👈 Đảm bảo WeeklyCalendar cũng nhận userId
      />
    </>
  );
};