// src/services/eventService.ts
import Client from "../../../Configs/CNAPI/CNAPI"; // hoặc đường dẫn tương ứng
import type { Event } from "../types/event"; 


export const eventService = {
  getAll: async (): Promise<Event[]> => {
    const res = await Client.get<Event[]>("/api/events");
    return res.data;
  },

  getByUserId: async (userId: string): Promise<Event[]> => {
    const res = await Client.get<Event[]>(`/api/events/user/${userId}`);
    return res.data;
  },

  getById: async (id: string): Promise<Event> => {
    const res = await Client.get<Event>(`/api/events/${id}`);
    return res.data;
  },

  create: async (event: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> => {
    const res = await Client.post<Event>("/api/events", event);
    return res.data;
  },

  update: async (event: Event): Promise<void> => {
    await Client.put(`/api/events/${event.id}`, event);
  },

  delete: async (id: string): Promise<void> => {
    await Client.delete(`/api/events/${id}`);
  },
};