// src/components/events/EventList.tsx
import { useState, useEffect } from "react";
import type { Event } from "../types/event";
import { eventService } from "../Services/eventService";
import EventForm from "./EventForm";

export default function EventList({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null); // <-- Thêm state này

  const loadEvents = () => {
    eventService.getByUserId(userId)
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, [userId]);

  const handleDelete = async (id: string) => {
    await eventService.delete(id);
    setDeleteConfirmId(null); // Đóng modal sau khi xóa
    loadEvents();
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(null);
    loadEvents();
  };

  const filteredEvents = events.filter((event) => {
    const matchesTitle = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate =
      event.startDate.includes(searchQuery) || event.endDate.includes(searchQuery);
    return matchesTitle || matchesDate;
  });

  if (loading) return <p className="text-center py-4">Đang tải...</p>;

  return (
    <div>
      {/* Nút thêm và thanh tìm kiếm */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Thêm sự kiện
        </button>
        <input
          type="text"
          placeholder="Tìm theo tiêu đề hoặc ngày (VD: 2025-10-21)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Form thêm/sửa */}
      {showForm && (
        <div className="mb-6 p-4 border rounded bg-white shadow-sm">
          <h3 className="mb-2 font-semibold">
            {editingId ? "Sửa sự kiện" : "Tạo sự kiện mới"}
          </h3>
          <EventForm
            eventId={editingId || undefined}
            userId={userId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </div>
      )}

      {/* Danh sách sự kiện có thể cuộn */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded p-2 bg-gray-50">
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Không có sự kiện nào phù hợp.</p>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-3 border rounded flex justify-between items-center bg-white shadow-sm"
            >
              <div>
                <h4 style={{ color: event.color }} className="font-medium">
                  {event.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {event.startDate} {event.startTime} – {event.endDate} {event.endTime}
                </p>
              </div>
              <div className="space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingId(event.id);
                    setShowForm(true);
                  }}
                  className="text-blue-500 hover:underline text-sm"
                >
                  Sửa
                </button>
                <button
                  onClick={() => setDeleteConfirmId(event.id)} // Mở modal xác nhận
                  className="text-red-500 hover:underline text-sm"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setViewEvent(event)}
                  className="text-gray-500 hover:underline text-sm"
                >
                  Xem
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal xem chi tiết */}
      {viewEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96 max-w-[90vw] shadow-lg">
            <h3 className="text-lg font-bold">{viewEvent.title}</h3>
            <p className="mt-2 text-gray-700">{viewEvent.description}</p>
            <p className="mt-2">
              Màu: <span style={{ color: viewEvent.color }}>●</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {viewEvent.startDate} {viewEvent.startTime} – {viewEvent.endDate} {viewEvent.endTime}
            </p>
            <button
              onClick={() => setViewEvent(null)}
              className="mt-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {deleteConfirmId && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-lg border-4 border-primary shadow-xl w-80 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-800">Xác nhận xóa</h3>
            <p className="mt-2 text-gray-600">
              Bạn có chắc muốn xóa sự kiện này? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}