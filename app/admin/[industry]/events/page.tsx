'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventsTab } from '../../components/EventsTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useEvents } from '../../hooks/useEvents';
import { useFlags } from '../../hooks/useFlags';
import { useUpgrades } from '../../hooks/useUpgrades';
import { useRoles } from '../../hooks/useRoles';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../utils/constants';
import { buildEventDetailUrl } from '../../utils/routing';

export default function EventsPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const events = useEvents(industry);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);
  const roles = useRoles(industry);

  // Auto-redirect to first event if events are loaded and not creating
  useEffect(() => {
    if (!events.loading && events.events.length > 0 && !events.isCreating) {
      const firstEvent = events.events[0];
      router.replace(buildEventDetailUrl(industry, firstEvent.id));
    }
  }, [events.loading, events.events, events.isCreating, industry, router]);

  // Handle event selection - navigate to detail page
  const handleSelectEvent = (event: import('@/lib/types/gameEvents').GameEvent) => {
    router.push(buildEventDetailUrl(industry, event.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    events.createEvent();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = events.isCreating;
    await events.saveEvent();
    
    if (wasCreating && events.form.id) {
      router.push(buildEventDetailUrl(industry, events.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await events.deleteEvent();
  };

  const sidebarItems = events.events.map((event) => ({
    id: event.id,
    label: event.title,
    icon: '📅',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (events.loading || (events.events.length > 0 && !events.isCreating)) {
    return (
      <SidebarContentLayout
        title="Events"
        description="Manage events for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const event = events.events.find(e => e.id === id);
          if (event) handleSelectEvent(event);
        }}
        loading={events.loading}
        actionButton={{
          label: '+ New Event',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '📅',
          title: 'Loading Events',
          description: 'Redirecting to first event...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Events"
      description={events.events.length === 0 ? "Create your first event" : "Select an event to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const event = events.events.find(e => e.id === id);
        if (event) handleSelectEvent(event);
      }}
      loading={events.loading}
      actionButton={{
        label: '+ New Event',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📅',
        title: events.events.length === 0 ? 'No Events Yet' : 'Select an Event',
        description: events.events.length === 0 
          ? 'Create your first event to get started'
          : 'Choose an event from the sidebar to edit',
      }}
      forceShowContent={events.isCreating}
    >
      {events.isCreating ? (
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
          onCreateEvent={handleCreateNew}
          onSaveEvent={handleSave}
          onDeleteEvent={handleDelete}
          onReset={events.reset}
          onUpdateEventForm={events.updateForm}
          onUpdateEventChoices={events.updateChoices}
          onPersistEventWithChoices={events.persistEventWithChoices}
          onUpdateStatus={events.updateStatus}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {events.events.length === 0 
            ? 'Click "+ New Event" to create your first event.'
            : 'Select an event from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
