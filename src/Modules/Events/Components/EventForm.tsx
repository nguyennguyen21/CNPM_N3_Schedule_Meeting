// src/components/events/EventForm.tsx

import { useState, useEffect } from "react";
import { eventService } from "../Services/eventService";
import type { Event } from "../types/event";

interface EventFormProps {
  eventId?: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helpers an toàn — chỉ trả về string | undefined (không null)
const combineToISO = (date: string | undefined, time: string | undefined): string | undefined => {
  if (!date || !time) return undefined;
  const dt = new Date(`${date}T${time}:00`);
  return isNaN(dt.getTime()) ? undefined : dt.toISOString();
};

const extractDate = (iso: string | undefined): string => {
  return iso ? iso.split("T")[0] : "";
};

const extractTime = (iso: string | undefined): string => {
  if (!iso) return "";
  const timePart = iso.split("T")[1];
  return timePart ? timePart.substring(0, 5) : "";
};

export default function EventForm({ eventId, userId, onSuccess, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState<Omit<Event, "id" | "createdAt" | "updatedAt">>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    color: "#3b82f6",
    location: "",
    meetingId: undefined,
    userId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data khi edit
  useEffect(() => {
    if (eventId) {
      eventService.getById(eventId).then((data) => {
        setFormData({
          title: data.title,
          description: data.description || "",
          startDate: data.startDate || extractDate(data.startTime),
          endDate: data.endDate || extractDate(data.endTime),
          startTime: extractTime(data.startTime),
          endTime: extractTime(data.endTime),
          color: data.color || "#3b82f6",
          location: data.location || "",
          meetingId: data.meetingId,
          userId: data.userId,
        });
      }).catch(() => setError("Không thể tải sự kiện."));
    }
  }, [eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Chuẩn bị payload — KHÔNG CÓ NULL
    const payload: Omit<Event, "id" | "createdAt" | "updatedAt"> = {
      title: formData.title,
      description: formData.description || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      startTime: combineToISO(formData.startDate, formData.startTime),
      endTime: combineToISO(formData.endDate, formData.endTime),
      color: formData.color,
      location: formData.location || undefined,
      meetingId: formData.meetingId,
      userId: formData.userId,
    };

    try {
      if (eventId) {
        const existing = await eventService.getById(eventId);
        await eventService.update({
          id: eventId,
          ...payload,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await eventService.create(payload); // ✅ Gửi đúng kiểu
      }
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const message = (err as any).response?.data?.message;
        setError(message || "Lỗi khi lưu sự kiện.");
      } else {
        setError("Lỗi không xác định.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label className="block">Tiêu đề *</label>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block">Mô tả</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Ngày kết thúc</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label>Giờ bắt đầu</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label>Giờ kết thúc</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div>
        <label>Màu sắc</label>
        <input
          type="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          className="w-12 h-8"
        />
      </div>

      <div>
        <label>Địa điểm</label>
        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : eventId ? "Cập nhật" : "Tạo mới"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}