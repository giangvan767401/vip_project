export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Appointment {
  id: string;
  userId: string;
  counselorId: string;
  startAt: string;
  note?: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  counselor?: {
    id: string;
    fullName: string;
    email: string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  sessionBrief?: import('./brief').SessionBrief | null;
}

export interface CreateAppointmentPayload {
  counselorId: string;
  startAt: string;
  note?: string;
}
