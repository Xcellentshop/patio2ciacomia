export interface CalendarEvent {
  id?: string;
  title: string;
  orderNumber: string;
  start: string;
  end: string;
  location: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}