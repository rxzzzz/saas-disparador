// src/types/index.ts
export type Contact = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  group: string | null;
  notes: string | null;
  user_id: string;
};