// src/types/event.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Meeting {
  id: string;
  title: string;
  // thêm các field khác nếu cần
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate?: string;   // "2025-10-18"
  endDate?: string;
  startTime?: string;   // ISO string, e.g. "2025-10-18T14:30:00.000Z"
  endTime?: string;
  color?: string;
  location?: string;
  meetingId?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}