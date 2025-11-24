# Typography System

This document describes the typography scale used throughout the application. The system provides semantic, responsive text sizes that automatically adapt to screen size.

## Design Philosophy

- **Mobile First**: Base sizes are optimized for mobile, scaling up on larger screens
- **Semantic Naming**: Use purpose-based names (caption, body, heading) rather than size-based (small, medium, large)
- **Consistent Scale**: All text sizes follow a consistent scale for visual harmony
- **Responsive**: Automatically adjusts between mobile and desktop breakpoints

## Typography Scale

### Text Size Classes

| Class | Mobile | Desktop (sm+) | Use Case |
|-------|--------|---------------|----------|
| `.text-micro` | 6px | 8px | Extreme compact, use sparingly |
| `.text-ultra-sm` | 8px | 10px | Ultra small labels, extreme space constraints |
| `.text-caption` | 9px | 12px | Tiny labels, metadata, timestamps |
| `.text-label` | 10px | 14px | Small labels, secondary info |
| `.text-body-sm` | 10px | 14px | Compact body text, fine print |
| `.text-body` | 12px | 16px | Standard body text, paragraphs |
| `.text-heading-sm` | 16px | 20px | Small section headings |
| `.text-heading` | 18px | 24px | Standard section headings |
| `.text-heading-lg` | 20px | 30px | Major section headings |
| `.text-heading-xl` | 24px | 36px | Page titles, hero headings |
| `.text-metric-sm` | 16px | 24px | Smaller metrics, numbers |
| `.text-metric` | 18px | 30px | Standard metrics, key numbers |
| `.text-display` | 20px | 36px | Large display numbers, totals |

### Usage Examples

```tsx
// Caption - for small metadata
<span className="text-caption text-muted">Last updated 2 hours ago</span>

// Label - for form labels or secondary info
<label className="text-label text-secondary">Email Address</label>

// Body - standard text
<p className="text-body">This is standard body text that will be readable on all devices.</p>

// Heading - section titles
<h2 className="text-heading text-primary">Financial Overview</h2>

// Metric - displaying numbers
<div className="text-metric text-success">$12,450</div>

// Display - large numbers
<div className="text-display text-primary">1,234</div>
```

### Combining with Other Utilities

You can combine typography classes with color and weight utilities:

```tsx
// Bold heading
<h2 className="text-heading font-bold text-primary">Section Title</h2>

// Colored metric
<div className="text-metric font-bold text-success">$5,000</div>

// Muted caption
<span className="text-caption text-muted">Optional helper text</span>
```

## Migration Guide

### Before (Inline Sizes)
```tsx
<span className="text-[10px] sm:text-xs">Label</span>
<div className="text-xl sm:text-2xl font-bold">$1,000</div>
```

### After (Typography System)
```tsx
<span className="text-label">Label</span>
<div className="text-metric font-bold">$1,000</div>
```

## Benefits

1. **Consistency**: All text uses the same scale, ensuring visual harmony
2. **Maintainability**: Change sizes globally by updating CSS variables
3. **Responsive**: Automatically adapts to screen size
4. **Semantic**: Code is more readable and self-documenting
5. **DRY**: No need to repeat responsive breakpoints everywhere

## When to Use Each Size

- **Micro (6px)**: Extreme compact spaces, use very sparingly - only when absolutely necessary
- **Ultra Small (8px)**: Extreme space constraints, very compact UI elements
- **Caption (9px)**: Timestamps, metadata, fine print, tooltips
- **Label (10px)**: Form labels, secondary information, small UI labels
- **Body**: Paragraphs, descriptions, general content
- **Heading**: Section titles, card titles, important labels
- **Metric**: Numbers, statistics, key values
- **Display**: Hero numbers, totals, prominent metrics

**Note**: The micro and ultra-small sizes are available in the design system but should be used sparingly. They're primarily for extreme mobile constraints where every pixel counts.

