// src/Pages/Events/EventPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventList from "../../Modules/Events/Components/EventList";
import WeeklyCalendar from '../../Modules/Calander/Calender';

export const EventPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // 👈 Dùng để trigger re-fetch
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/login', { replace: true });
      return;
    }
    setUserId(storedUserId);
    setLoading(false);
  }, [navigate]);

  const handleEventChange = () => {
    setRefreshKey(prev => prev + 1); // 👈 Tăng key → re-render cả 2 component
  };

  if (loading || !userId) {
    return <div className="p-10">Đang tải...</div>;
  }

  return (
    <>
      <EventList 
        userId={userId} 
        onEventChange={handleEventChange} // 👈 Truyền callback
      />
      <WeeklyCalendar 
        userId={userId}
        refreshKey={refreshKey} // 👈 Truyền refreshKey để WeeklyCalendar theo dõi
      />
    </>
  );
};