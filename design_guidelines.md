# Full Loop Report - Design Guidelines

## Design Approach: Material Design 3 (Mobile Utility)

**Rationale**: Material Design 3 excels at mobile-first utility applications with proven touch patterns, accessibility standards, and high-contrast support for outdoor visibility. Perfect for field workers who need quick, reliable interactions.

## Typography

**Font Family**: Roboto (via Google Fonts CDN)
- Display: Roboto Medium, 24px - Page headers
- Headline: Roboto Medium, 20px - Section headers
- Body Large: Roboto Regular, 16px - Primary content, form labels
- Body: Roboto Regular, 14px - Secondary text
- Label: Roboto Medium, 14px - Buttons, tabs

## Layout System

**Spacing Units**: Tailwind units of 4, 6, and 8 (p-4, h-8, m-6, etc.)

**Mobile-First Grid**:
- Container: px-4 for edge breathing room
- Vertical rhythm: space-y-6 between major sections
- Touch targets: Minimum h-12 (48px) for all interactive elements
- Bottom action bar: h-16 fixed with safe-area-inset padding

## Component Library

### Navigation
**Top App Bar**: Fixed header (h-14) with back button, page title, overflow menu - keeps thumb zone clear
**Bottom Action Bar**: Fixed (h-16) with 2-3 primary action buttons, elevation shadow, blur backdrop for content underneath

### Forms & Input
**Text Fields**: Outlined style, h-12 minimum, 16px text, persistent labels, high contrast borders (2px solid)
**Dropdown Selects**: Large touch area (h-12), clear chevron icons, full-screen mobile picker
**Date/Time Pickers**: Native mobile pickers with large tap targets
**Checkboxes/Radio**: 24px touch targets with 16px visible size, clear labels

### Action Components
**Primary Buttons**: Filled style, h-12, rounded-lg, w-full on mobile, bold labels
**Secondary Buttons**: Outlined style, h-12, same sizing
**FAB (Floating Action Button)**: 56px circular, bottom-right (but anchored above bottom bar), primary action like "New Violation"
**Chip Filters**: h-10, rounded-full, easy thumb press

### Data Display
**Violation Cards**: Rounded-xl, p-4, clear visual hierarchy, tap for detail, swipe actions for quick edit/delete
**Status Badges**: Rounded-full, px-3, py-1, uppercase labels (12px)
**List Items**: h-16 minimum, clear dividers, right-aligned chevrons

### Feedback
**Snackbars**: Bottom-floating (above action bar), 4-second duration, single action button
**Loading States**: Circular progress indicators, skeleton screens for lists
**Error States**: Inline field errors (red text below input), error icons

## Layout Patterns

### Violation Logging Screen (Primary)
- Fixed top bar with "New Violation" title
- Scrollable form area with generous spacing (space-y-6)
- Large form fields stacked vertically
- Fixed bottom bar with "Cancel" (secondary) and "Submit" (primary) buttons side-by-side

### Dashboard/List View
- Top bar with filter icon and search
- Pull-to-refresh enabled
- Violation cards in vertical scroll (space-y-4)
- FAB for quick add
- Bottom bar with "Export Report" and "Sync" actions

### Single-Handed Optimization
- All primary actions within thumb reach (bottom third of screen)
- Secondary actions in top bar (reachable but less frequent)
- Swipe gestures for common actions (swipe left to delete, right to edit)
- Large tap targets throughout (never smaller than h-12)

## Images

**No hero image** - This is a utility app, not a marketing site. Focus remains on functional interfaces and quick data entry.

**Icon Usage**: Material Icons via CDN for consistency - use 24px size throughout for clarity

## Accessibility

- Minimum 4.5:1 contrast ratios for all text (outdoor visibility requires even higher)
- Touch targets never overlap, minimum 8px spacing between interactive elements
- Form labels always visible (no placeholder-only patterns)
- Clear focus states with 2px outline rings
- Screen reader labels on all icon-only buttons

**Critical**: Every interactive element maintains h-12 minimum height with clear visual feedback on touch. Bottom action bar remains accessible even when keyboard is visible through safe-area considerations.