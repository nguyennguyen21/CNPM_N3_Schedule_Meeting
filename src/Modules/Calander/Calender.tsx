import React, { useState, useEffect, useRef } from 'react';
import { eventService } from '../Events/Services/eventService';
import type { Event as ApiEvent } from '../Events/types/event';

interface CalendarEvent {
 id: string;
 title: string;
 start: Date;
  end: Date;
color: string | null;
location: string;
description: string | null;
}

// FIX: Hàm parse thời gian mới - Xử lý chuỗi thời gian API là thời gian ĐỊA PHƯƠNG (Local Time)
const parseLocalDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  // Sử dụng constructor Date() không có Date.UTC()
  return new Date(year, month - 1, day, hours, minutes, seconds); 
};

const hexToRgba = (hex: string, alpha = 0.2): string => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return `rgba(243, 244, 246, ${alpha})`;
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getColorClasses = (color: string | null | undefined): string | null => {
  if (!color) return null;
  if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
    return null;
  }
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 border-l-4 border-blue-500',
    green: 'bg-green-100 border-l-4 border-green-500',
    red: 'bg-red-100 border-l-4 border-red-500',
    yellow: 'bg-yellow-100 border-l-4 border-yellow-500',
    purple: 'bg-purple-100 border-l-4 border-purple-500',
    gray: 'bg-gray-100 border-l-4 border-gray-500',
    orange: 'bg-orange-100 border-l-4 border-orange-500',
    pink: 'bg-pink-100 border-l-4 border-pink-500',
  };
  return colorMap[color.toLowerCase()] || null;
};

const WeeklyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'hour'>('week');
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const closeModal = () => setModalEvent(null);

  const getUserId = (): string | null => {
    return localStorage.getItem('userId');
  };

  // Format Date to local time string for API (HH:MM:SS)
  const formatTimeForApi = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`; 
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const userId = getUserId();
      if (!userId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        const apiEvents: ApiEvent[] = await eventService.getByUserId(userId);
        const calendarEvents: CalendarEvent[] = apiEvents
          .filter((e) => e.startDate && e.startTime)
          .map((e) => {
            // FIX: Parse start as LOCAL
            const startTimeOnly = e.startTime!.includes('T')
              ? e.startTime!.split('T')[1].slice(0, 8)
              : e.startTime!;
            const start = parseLocalDateTime(e.startDate, startTimeOnly);

            // FIX: Parse end as LOCAL
            let end = start;
            if (e.endDate && e.endTime) {
              const endTimeOnly = e.endTime.includes('T')
                ? e.endTime.split('T')[1].slice(0, 8)
                : e.endTime;
              end = parseLocalDateTime(e.endDate, endTimeOnly);
            } else {
                // Ensure 'end' is calculated to be after 'start' (30 minutes minimum)
                end = new Date(start.getTime() + 30 * 60 * 1000); 
            }

            return {
              id: e.id,
              title: e.title,
              start,
              end,
              color: e.color || null,
              location: e.location || '',
              description: e.description || null,
            };
          });
        setEvents(calendarEvents);
        setError(null);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleEventMove = async (eventId: string, newStart: Date, newEnd: Date) => {
    const userId = getUserId();
    if (!userId) return;

    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    try {
      const originalEvent = await eventService.getById(eventId);

      const updatedEvent: ApiEvent = {
        ...originalEvent,
        startDate: newStart.toISOString().split('T')[0], // YYYY-MM-DD
        startTime: formatTimeForApi(newStart), // HH:MM:SS in Local Time
      };
      
      // FIX: Ensure newEnd is used if the original event had an end time
      if (originalEvent.endTime != null && originalEvent.endDate != null) {
        updatedEvent.endDate = newEnd.toISOString().split('T')[0];
        updatedEvent.endTime = formatTimeForApi(newEnd);
      } else {
        // For single-time events, clear end date/time to avoid saving the minimum duration back to API
        updatedEvent.endDate = null;
        updatedEvent.endTime = null;
      }

      await eventService.update(updatedEvent);

      const hasEndTime = originalEvent.endTime != null;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                start: newStart,
                // Update end time correctly, using newEnd if it originally had an end time
                end: hasEndTime ? newEnd : new Date(newStart.getTime() + 30 * 60 * 1000), 
                description: e.description,
                location: e.location,
              }
            : e
        )
      );
    } catch (err) {
      console.error('Failed to move event:', err);
      setError('Failed to update event');
    }
  };

  // === HELPER ===
  // Bắt đầu tuần là Thứ Hai (MON)
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const visibleHours = Array.from({ length: 24 }, (_, i) => i);

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Tính toán chênh lệch để lùi về Thứ Hai (1)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff);
    d.setHours(0, 0, 0, 0); // Đặt về 00:00:00 sáng
    return d;
  };

  const weekStart = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    // Vẫn giữ giờ là 00:00:00 local time
    return d;
  });

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    const min = m < 10 ? `0${m}` : m;
    return `${hour}:${min} ${ampm}`;
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // === RENDER VIEWS ===

  const renderMonthView = () => {
    // ... (Logic renderMonthView không thay đổi)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

    const calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      calendarDays.push(dayDate);
    }

    const eventsByDate: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      // Sử dụng ngày bắt đầu local time để nhóm
      const key = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate()).toDateString();
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(event);
    });

    return (
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 text-center text-sm font-medium text-gray-500">
          {daysOfWeek.map((day) => (
            <div key={day} className="p-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const dayKey = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toDateString();
            const dayEvents = eventsByDate[dayKey] || [];

            return (
              <div
                key={index}
                className={`min-h-24 p-2 border-t border-l border-gray-200 cursor-pointer relative
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50' : ''}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div
                  className={`text-sm font-medium ${
                    isCurrentMonth ? (isToday ? 'text-blue-600' : 'text-gray-900') : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => {
                    const isHex = event.color?.startsWith('#');
                    const bgColor = isHex
                      ? hexToRgba(event.color!, 0.4)
                      : getColorClasses(event.color)?.split(' ')[0] || 'bg-gray-200';
                    return (
                      <div
                        key={idx}
                        className="w-full h-2 rounded-sm cursor-pointer"
                        style={{ backgroundColor: isHex ? bgColor : undefined }}
                        title={`${event.title} – ${formatTime(event.start)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalEvent(event);
                        }}
                      />
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEvents = events.filter((e) => e.end > weekStart && e.start < weekEnd);

    const totalGridHeightPx = 80 * 24; // 80px per hour * 24 hours

    return (
      <>
        {/* Header ngày */}
        <div className="grid grid-cols-8 gap-0 border-b border-gray-200 bg-gray-50">
          <div className="p-3 text-right text-sm font-medium text-gray-500">Time</div>
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                className={`p-3 text-center text-sm font-medium cursor-pointer ${
                  isSelected ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleDateClick(date)}
              >
                <div className="font-semibold">{daysOfWeek[index]}</div>
                <div className="mt-1">
                  <span className="font-bold">{date.getDate()}</span>
                  {(index === 0 || date.getDate() === 1) && (
                    <span className="text-xs text-gray-500 block mt-1">
                      {date.toLocaleString('en-US', { month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid giờ + overlay sự kiện */}
        <div
          className="relative overflow-y-auto max-h-[80vh] border-t border-gray-200"
          style={{ height: 'calc(80vh - 60px)' }}
          ref={scrollRef}
        >
          <div className="grid grid-cols-1">
            {visibleHours.map((hour) => {
              const ampm = hour < 12 ? 'AM' : 'PM';
              const displayHour = hour % 12 || 12;
              return (
                <div
                  key={hour}
                  className="h-20 border-t border-gray-200 flex items-center pr-3"
                  style={{ height: '80px' }}
                >
                  <div className="text-right text-sm text-gray-500 w-full">
                    {displayHour} {ampm}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="absolute top-0 left-0 w-full h-[1920px] grid grid-cols-8 gap-0" 
            style={{ height: `${totalGridHeightPx}px` }}
          >
                <div className="col-span-1"></div> {/* Cột thời gian */}
                {weekDates.map((date, index) => {
                    const dropZoneStartOfDay = new Date(date);
                    dropZoneStartOfDay.setHours(0, 0, 0, 0);

                    const dropZoneEndOfDay = new Date(dropZoneStartOfDay);
                    dropZoneEndOfDay.setDate(dropZoneEndOfDay.getDate() + 1);

                    return (
                        <div
                            key={index}
                            className="relative border-r border-gray-100 pointer-events-auto"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const eventId = e.dataTransfer.getData('eventId');
                                const targetEvent = events.find((ev) => ev.id === eventId);
                                if (!targetEvent) return;

                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                
                                const totalMinutes = Math.floor((offsetY / 80) * 60);
                                const hour = Math.floor(totalMinutes / 60);
                                const minutes = Math.round((totalMinutes % 60) / 5) * 5; // Làm tròn 5 phút

                                const newStart = new Date(date); // Ngày drop
                                newStart.setHours(hour, minutes, 0, 0);

                                // Giữ nguyên thời lượng sự kiện
                                const durationMs = targetEvent.end.getTime() - targetEvent.start.getTime();
                                const newEnd = new Date(newStart.getTime() + durationMs);

                                handleEventMove(eventId, newStart, newEnd);
                            }}
                        >
                            {/* Hiện tại nếu là hôm nay */}
                            {date.toDateString() === new Date().toDateString() && (
                                <div
                                    className="absolute w-full h-0.5 bg-red-500 z-20 pointer-events-none"
                                    style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 80}px` }}
                                >
                                    <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500"></div>
                                </div>
                            )}
                            
                            {/* FIX: Lặp qua tất cả sự kiện và tính toán segment cho ngày hiện tại */}
                            {weekEvents.map((event) => {
                                const eventStart = event.start;
                                const eventEnd = event.end;
                                
                                // Tính toán segment start và end times cho ngày hiện tại
                                const segmentStart = new Date(Math.max(eventStart.getTime(), dropZoneStartOfDay.getTime()));
                                const segmentEnd = new Date(Math.min(eventEnd.getTime(), dropZoneEndOfDay.getTime()));

                                // Nếu sự kiện không nằm trong ngày này, bỏ qua
                                if (segmentStart.getTime() >= segmentEnd.getTime()) {
                                    return null;
                                }

                                // Tính toán vị trí và chiều cao (dựa trên segment)
                                const segmentStartMinutesFromMidnight = segmentStart.getHours() * 60 + segmentStart.getMinutes();
                                const segmentDurationMinutes = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60);

                                const topPx = (segmentStartMinutesFromMidnight / 60) * 80;
                                const heightPx = Math.max(24, (segmentDurationMinutes / 60) * 80);

                                const tailwindClasses = getColorClasses(event.color);
                                const isHexColor = event.color?.startsWith('#') && (event.color.length === 4 || event.color.length === 7);
                                
                                // Kiểm tra xem đây có phải là ngày đầu tiên của sự kiện không
                                const isFirstDay = segmentStart.toDateString() === eventStart.toDateString();
                                // Kiểm tra xem đây có phải là ngày cuối cùng của sự kiện không
                                const isLastDay = segmentEnd.getTime() === eventEnd.getTime();

                                // Điều chỉnh top và height để xử lý sự kiện kéo dài 24h/nhiều ngày
                                const finalTop = topPx < 0 ? 0 : topPx; // Nếu sự kiện bắt đầu trước nửa đêm
                                const finalHeight = heightPx + (topPx < 0 ? topPx : 0); 
                                
                                // Nội dung chỉ hiển thị ở segment ngày đầu tiên
                                const renderContent = isFirstDay || (segmentStart.getHours() === 0 && segmentStart.getMinutes() === 0 && finalHeight > 50);

                                return (
                                    <div
                                        key={event.id + date.getDate()} // Dùng ID + ngày để đảm bảo key là duy nhất
                                        draggable={isFirstDay} // Chỉ kéo thả từ ngày bắt đầu
                                        onDragStart={(e) => {
                                            if (isFirstDay) {
                                                e.dataTransfer.setData('eventId', event.id);
                                                e.dataTransfer.effectAllowed = 'move';
                                                e.stopPropagation();
                                            }
                                        }}
                                        className={`absolute rounded-sm p-2 text-sm font-medium shadow-sm z-10 
                                            ${tailwindClasses || 'bg-gray-100 border-l-4 border-gray-500'}
                                            ${isFirstDay ? 'cursor-move' : 'cursor-default'}
                                            ${segmentStart.getTime() !== eventStart.getTime() ? 'rounded-t-none border-t border-dashed' : ''} 
                                            ${segmentEnd.getTime() !== eventEnd.getTime() && segmentEnd.toDateString() !== eventEnd.toDateString() ? 'rounded-b-none' : ''}
                                        `}
                                        style={{
                                            left: 0,
                                            width: '100%',
                                            top: `${finalTop}px`,
                                            height: `${finalHeight}px`,
                                            ...(isHexColor
                                                ? {
                                                    backgroundColor: hexToRgba(event.color!),
                                                    borderLeft: `4px solid ${event.color}`,
                                                }
                                                : {}),
                                        }}
                                        onClick={(e) => {
                                            if (e.detail === 1) {
                                                setModalEvent(event);
                                            }
                                        }}
                                    >
                                        {renderContent && (
                                            <>
                                                <div className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {event.title}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center mt-1 text-xs">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.995 1.995 0 01-2.828 0l-4.244-4.244a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {renderContent && finalHeight > 50 && (
                                            <div className="flex items-center mt-1 text-xs">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatTime(segmentStart)} – {formatTime(segmentEnd)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-right">Scroll to view more hours</div>
      </>
    );
  };

  const renderDayView = () => {
    // ... (Logic renderDayView không thay đổi)
    const day = selectedDate;
    // FIX: Lọc sự kiện theo ngày local time thay vì chỉ so sánh ngày
    const dayEvents = events.filter(
      (e) =>
        e.start.toDateString() === day.toDateString()
    );

    return (
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">
          {day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <p className="text-gray-500 italic">No events scheduled.</p>
          ) : (
            dayEvents
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg shadow-sm border-l-4 ${
                    getColorClasses(event.color) || 'bg-gray-100 border-gray-500'
                  }`}
                  style={
                    event.color?.startsWith('#')
                      ? {
                          backgroundColor: hexToRgba(event.color),
                          borderLeftColor: event.color,
                        }
                      : {}
                  }
                  onClick={() => setModalEvent(event)}
                >
                  <div className="font-semibold">{event.title}</div>
                  <div className="flex items-center mt-1 text-sm text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(event.start)} – {formatTime(event.end)}
                  </div>
                  {event.location && (
                    <div className="flex items-center mt-1 text-sm text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.995 1.995 0 01-2.828 0l-4.244-4.244a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  const renderHourView = () => {
    // ... (Logic renderHourView không thay đổi)
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEvents = events.filter((e) => e.start >= weekStart && e.start < weekEnd);

    return (
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Agenda</h2>
        <div className="space-y-3">
          {weekEvents.length === 0 ? (
            <p className="text-gray-500 italic">No events this week.</p>
          ) : (
            weekEvents
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    getColorClasses(event.color) || 'bg-gray-100 border-gray-500'
                  }`}
                  style={
                    event.color?.startsWith('#')
                      ? {
                          backgroundColor: hexToRgba(event.color),
                          borderLeftColor: event.color,
                        }
                      : {}
                  }
                  onClick={() => setModalEvent(event)}
                >
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm text-gray-700">
                    {event.start.toLocaleDateString()} • {formatTime(event.start)} – {formatTime(event.end)}
                  </div>
                  {event.location && (
                    <div className="text-sm text-gray-700 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.995 1.995 0 01-2.828 0l-4.244-4.244a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg max-w-full mx-auto">
        <div className="text-center py-10 text-gray-500">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg max-w-full mx-auto">
        <div className="text-center py-10 text-red-500">{error}</div>
        {error.includes('logged in') && (
            <div className="text-center mt-4 text-sm text-gray-600">
                Please ensure you have a valid 'userId' in localStorage.
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-full mx-auto relative">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            aria-label="Go to today"
          >
            Today
          </button>

          {view === 'week' && (
            <>
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Previous week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Next week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {view === 'month' && (
            <>
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Previous month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                aria-label="Next month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <h1 className="text-2xl font-bold">
            {view === 'month'
              ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              : `${weekDates[0].toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </h1>
        </div>

        <div className="flex items-center space-x-4 flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="timezone-select" className="text-sm">Timezone</label>
            <select
              id="timezone-select"
              className="border rounded px-3 py-1.5 text-sm"
              aria-label="Select timezone"
            >
              <option>GMT+07:00 Asia – Ho Chi Minh (Local)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="view-select" className="text-sm">View</label>
            <select
              id="view-select"
              value={view}
              onChange={(e) => setView(e.target.value as any)}
              className="border rounded px-3 py-1.5 text-sm"
              aria-label="Select calendar view"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="hour">Agenda</option>
            </select>
          </div>

          {view !== 'month' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="text-sm font-medium text-gray-700">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setSelectedDate(newDate);
                  setCurrentDate(newDate);
                }}
                className="border rounded px-3 py-1.5 text-sm"
                aria-label="Select date"
              />
            </div>
          )}
        </div>
      </div>

      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
      {view === 'hour' && renderHourView()}

      {/* Event Detail Modal */}
      {modalEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-4">{modalEvent.title}</h2>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {modalEvent.start.toLocaleDateString()} • {formatTime(modalEvent.start)} – {formatTime(modalEvent.end)}
                </span>
              </div>

              {modalEvent.location && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.995 1.995 0 01-2.828 0l-4.244-4.244a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{modalEvent.location}</span>
                </div>
              )}

              {modalEvent.description && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-1 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="whitespace-pre-wrap break-words">{modalEvent.description}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCalendar;