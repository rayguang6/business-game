export const EventCategory = {
  Opportunity: "opportunity",
  GoodBad: "good-bad",
} as const;

export type EventCategoryType =
  typeof EventCategory[keyof typeof EventCategory];

export const AUTO_RESOLVE_CATEGORIES = new Set<EventCategoryType>([
  EventCategory.GoodBad,
]);

