'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventsTab } from '../../../components/EventsTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useEvents } from '../../../hooks/useEvents';
import { useFlags } from '../../../hooks/useFlags';
import { useUpgrades } from '../../../hooks/useUpgrades';
import { useRoles } from '../../../hooks/useRoles';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../../utils/constants';
import { buildEventDetailUrl } from '../../../utils/routing';

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ industry: string; eventId: string }>;
}) {
  const { industry, eventId } = use(params);
  const router = useRouter();
  const events = useEvents(industry, eventId);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);
  const roles = useRoles(industry);

  // Redirect to list if event not found (404 handling)
  useEffect(() => {
    if (!events.loading && !events.isCreating && events.events.length > 0) {
      const event = events.events.find(e => e.id === eventId);
      if (!event) {
        router.replace(`/admin/${industry}/events`);
      }
    }
  }, [events.loading, events.isCreating, events.events, eventId, industry, router]);

  // Handle event selection from sidebar - navigate to URL
  const handleSelectEvent = (event: import('@/lib/types/gameEvents').GameEvent) => {
    router.push(buildEventDetailUrl(industry, event.id));
  };

  // Handle save - navigate to detail page after creating new event
  const handleSave = async () => {
    const wasCreating = events.isCreating;
    await events.saveEvent();
    
    if (wasCreating && events.form.id) {
      router.push(buildEventDetailUrl(industry, events.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await events.deleteEvent();
    router.push(`/admin/${industry}/events`);
  };

  const sidebarItems = events.events.map((event) => ({
    id: event.id,
    label: event.title,
    icon: '📅',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Events"
      description="Manage events for this industry"
      sidebarItems={sidebarItems}
      selectedId={eventId}
      onSelect={(id) => {
        const event = events.events.find(e => e.id === id);
        if (event) handleSelectEvent(event);
      }}
      loading={events.loading}
      actionButton={{
        label: '+ New Event',
        onClick: events.createEvent,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📅',
        title: 'No Events Yet',
        description: 'Create your first event to get started',
      }}
    >
      <EventsTab
        industryId={industry}
        events={events.events}
        eventsLoading={events.loading}
        selectedEventId={events.selectedId}
        isCreatingEvent={events.isCreating}
        eventForm={events.form}
        eventChoices={events.choices}
        eventSaving={events.saving}
        eventDeleting={events.deleting}
        flags={flags.flags}
        flagsLoading={flags.loading}
        upgrades={upgrades.upgrades}
        staffRoles={roles.roles}
        metricOptions={METRIC_OPTIONS}
        effectTypeOptions={EFFECT_TYPE_OPTIONS}
        onSelectEvent={handleSelectEvent}
        onCreateEvent={events.createEvent}
        onSaveEvent={handleSave}
        onDeleteEvent={handleDelete}
        onReset={events.reset}
        onUpdateEventForm={events.updateForm}
        onUpdateEventChoices={events.updateChoices}
        onPersistEventWithChoices={events.persistEventWithChoices}
        onUpdateStatus={events.updateStatus}
      />
    </SidebarContentLayout>
  );
}
