// src/types/entities.ts
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  is_organizer: boolean;
  is_student: boolean;
}

export interface Tag {
    id: number;
    name: string;
    color?: string;
    created_at: string;
}


export interface Event {
  id: number;
  title: string;
  description: string;
  dt_start: string; // ISO 8601 date string
  location_text: string;
  tags?: Tag[]; // Массив тегов или null, если нет тегов
  organizer: User;
  max_participants: number | null;
  created_at: string; // ISO 8601 date string
  is_registered: boolean;
  spots_left: number | null;
  is_organizer: boolean;
}

export interface RegistrationShort {
  id: string; // UUID
  event_title: string;
  event_dt_start: string; // ISO 8601
  event_location: string;
  attended: boolean;
  qr_code_data: string; // UUID as string
}

export interface RegistrationFull {
   id: string; // UUID
   student: User;
   event: Event;
   registered_at: string; // ISO 8601
   attended: boolean;
}

// Добавьте другие типы по мере необходимости