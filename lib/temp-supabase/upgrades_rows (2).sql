INSERT INTO "public"."upgrades"
  ("id", "industry_id", "name", "description", "icon", "cost", "max_level", "sets_flag", "requirements", "effects")
VALUES
  (
    'extra_treatment_room',
    'dental',
    'Extra Service Room',
    'Add another service room so more patients can be helped at once.',
    '🦷',
    '1200.00',
    '3',
    null,
    '[]',
    '[{"metric":"serviceRooms","type":"add","value":1},{"metric":"monthlyExpenses","type":"add","value":150}]'
  ),
  (
    'gym_new_equipment',
    'gym',
    'Training Equipment',
    'Invest in a new set of training gear to reduce customer wait times.',
    '🏋️',
    '900.00',
    '3',
    null,
    '[]',
    '[{"metric":"serviceSpeedMultiplier","type":"percent","value":10},{"metric":"monthlyExpenses","type":"add","value":95}]'
  ),
  (
    'gym_recovery_lounge',
    'gym',
    'Recovery Lounge',
    'Create a recovery lounge that keeps members energized between sessions.',
    '🧘',
    '600.00',
    '1',
    null,
    '[]',
    '[{"metric":"serviceSpeedMultiplier","type":"percent","value":8},{"metric":"monthlyExpenses","type":"add","value":70}]'
  ),
  (
    'restaurant_extra_table',
    'restaurant',
    'Expanded Seating',
    'Add a few extra tables to welcome more guests during peak hours.',
    '🪑',
    '800.00',
    '2',
    null,
    '[]',
    '[{"metric":"serviceRooms","type":"add","value":1},{"metric":"monthlyExpenses","type":"add","value":90}]'
  ),
  (
    'restaurant_kitchen_upgrade',
    'restaurant',
    'Kitchen Line Upgrade',
    'Streamline the kitchen line to serve dishes a bit faster.',
    '👨‍🍳',
    '950.00',
    '2',
    null,
    '[]',
    '[{"metric":"serviceSpeedMultiplier","type":"percent","value":15},{"metric":"monthlyExpenses","type":"add","value":110}]'
  );
