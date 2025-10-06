# Visual Feedback System

## Overview
A simple, elegant animation system that shows floating "+100" style notifications when metrics change in the game.

## Features
- ✅ Shows visual feedback when cash, revenue, reputation, or expenses change
- ✅ Color-coded: Green for gains, Red for losses, Yellow for reputation, Blue for revenue
- ✅ Smooth float-up animation with fade out
- ✅ Automatic cleanup - no memory leaks
- ✅ Multiple feedback items can stack

## How It Works

### 1. **useMetricChanges Hook** (`hooks/useMetricChanges.ts`)
Tracks changes in game metrics by comparing previous values:
- Monitors: cash, reputation, weekly revenue, weekly expenses
- Returns an object with the delta (change amount) for each metric
- Auto-resets after 100ms to avoid duplicate triggers

### 2. **MetricFeedback Component** (`app/game/components/ui/MetricFeedback.tsx`)
Renders floating feedback animations:
- Takes an array of feedback items (value, color, label)
- Each item floats up and fades out over 1.5 seconds
- Automatically cleans up when animation completes

### 3. **KeyMetrics Integration** (`app/game/components/ui/KeyMetrics.tsx`)
Displays metrics with feedback:
- Listens to metric changes via `useMetricChanges()`
- Creates feedback items when values change
- Positions feedback over the appropriate metric container

## Animation Details

**CSS Animation** (`app/globals.css`):
```css
@keyframes float-up {
  0%   → Start at center, full opacity, normal size
  50%  → Float up 10px, slight scale up (1.1x)
  100% → Float up 20px, fade out, slight scale down (0.9x)
}
```

**Duration**: 1.5 seconds
**Easing**: ease-out

## Usage Example

The feedback system is already integrated! When playing the game:

1. **Customer completes service** → Shows "+100" (green) on Cash
2. **Customer leaves happy** → Shows "+1" (yellow) on Reputation
3. **Customer leaves angry** → Shows "-1" (red) on Reputation  
4. **Week ends** → Shows "-800" (red) on Cash
5. **Buy upgrade** → Shows expense increase (red) on Weekly Expenses

## Color Coding

| Color  | Used For                    | Meaning           |
|--------|----------------------------|-------------------|
| Green  | Cash gains                 | Positive change   |
| Red    | Cash losses, expense increases, reputation loss | Negative change |
| Yellow | Reputation gains           | Achievement       |
| Blue   | Revenue increases          | Income            |

## Technical Details

**Performance:**
- Uses CSS transforms (GPU accelerated)
- Efficient state management with React hooks
- Automatic cleanup prevents memory leaks
- Throttled to prevent spam (100ms debounce)

**Positioning:**
- Feedback appears in the center of each metric container
- Uses absolute positioning with pointer-events-none
- Doesn't interfere with user interaction

## Future Enhancements (Optional)

1. **Sound effects** - Add subtle "cha-ching" for cash gains
2. **Particle effects** - Add sparkles for big gains
3. **Combo system** - Show "x3 combo!" for multiple quick gains
4. **Variable size** - Bigger numbers = bigger text
5. **Different animations** - Shake for losses, bounce for gains

