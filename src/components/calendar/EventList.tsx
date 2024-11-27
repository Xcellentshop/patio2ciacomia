import React from 'react';
import { CalendarEvent } from '../../types/calendar';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';

interface EventListProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function EventList({ events, onEventClick }: EventListProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const upcomingEvents = sortedEvents.filter(event => 
    new Date(event.start) >= new Date()
  );

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Próximos Eventos
      </h3>
      
      <div className="space-y-4">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              style={{ borderLeft: `4px solid ${event.color}` }}
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {event.title}
              </h4>
              
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {format(new Date(event.start), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>

                {event.orderNumber && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    OS: {event.orderNumber}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhum evento próximo
          </p>
        )}
      </div>
    </div>
  );
}