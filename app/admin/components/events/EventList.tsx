'use client';

import type { GameEvent } from '@/lib/types/gameEvents';

interface EventListProps {
  events: GameEvent[];
  eventsLoading: boolean;
  selectedEventId: string;
  isCreatingEvent: boolean;
  onSelectEvent: (event: GameEvent) => void;
  onCreateEvent: () => void;
}

export function EventList({
  events,
  eventsLoading,
  selectedEventId,
  isCreatingEvent,
  onSelectEvent,
  onCreateEvent,
}: EventListProps) {
  if (eventsLoading) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700">
        <div className="text-slate-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-200">Events</h3>
        <button
          type="button"
          onClick={onCreateEvent}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
        >
          + Create Event
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onSelectEvent(event)}
            className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
              (selectedEventId === event.id && !isCreatingEvent)
                ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
            }`}
          >
            {event.title}
          </button>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-slate-400 text-sm">
          No events found. Create your first event to get started.
        </div>
      )}
    </div>
  );
}