import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CalendarEvent } from '../../types/calendar';
import { toast } from 'react-hot-toast';
import EventModal from './EventModal';
import EventList from './EventList';
import { useTheme } from '../../contexts/ThemeContext';

const EVENT_COLORS = [
  '#7C3AED', // Violeta
  '#10B981', // Verde
  '#F59E0B', // Âmbar
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#06B6D4', // Ciano
];

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const snapshot = await getDocs(eventsRef);
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarEvent[];
      setEvents(eventData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (arg: { event: any }) => {
    const event = events.find(e => e.id === arg.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      
      if (selectedEvent?.id) {
        await updateDoc(doc(db, 'events', selectedEvent.id), {
          ...eventData,
          updatedAt: now
        });
        toast.success('Ordem de serviço atualizada com sucesso');
      } else {
        const newEvent = {
          ...eventData,
          color: EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
          createdAt: now,
          updatedAt: now
        };
        await addDoc(collection(db, 'events'), newEvent);
        toast.success('Ordem de serviço criada com sucesso');
      }
      
      fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
      toast.error('Erro ao salvar ordem de serviço');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      toast.success('Ordem de serviço excluída com sucesso');
      fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
      toast.error('Erro ao excluir ordem de serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            headerToolbar={{
              left: 'prev,next hoje',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia'
            }}
            events={events.map(event => ({
              id: event.id,
              title: event.title,
              start: event.start,
              end: event.end,
              color: event.color
            }))}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="23:00:00"
            timeZone="America/Sao_Paulo"
            firstDay={0}
            allDaySlot={false}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric'
            }}
            themeSystem={isDark ? 'darkly' : 'standard'}
            className={`${isDark ? 'fc-dark' : ''} calendar-custom`}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <EventList events={events} onEventClick={(event) => {
            setSelectedEvent(event);
            setShowEventModal(true);
          }} />
        </div>
      </div>

      {showEventModal && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedDate}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}