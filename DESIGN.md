---
name: Pro-Management Modernist
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb690'
  on-tertiary: '#552100'
  tertiary-container: '#b54e00'
  on-tertiary-container: '#ffece5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  pos-price:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-mobile: 16px
  margin-tablet: 24px
  margin-desktop: 32px
  touch-target-min: 48px
---

## Brand & Style

The design system is engineered for high-stakes, high-velocity environments where precision and speed are non-negotiable. The brand personality is that of a "High-Functioning Orchestrator": reliable, invisible when it needs to be, and authoritative when providing data. 

The aesthetic follows a **Corporate Modern** approach with a focus on functional density. It prioritizes information hierarchy and eye-comfort, utilizing a dark-themed interface to reduce glare in dim restaurant environments and minimize eye fatigue during long shifts. The visual language is structured, grid-locked, and intentionally avoids unnecessary ornamentation to ensure that the user's cognitive load is reserved entirely for operational tasks.

## Colors

The color system is built on a "Dark UI First" philosophy. 
- **Action Blue (Primary):** A high-visibility, professional blue used exclusively for primary actions, navigation states, and interactive focal points.
- **Success Green (Secondary):** Reserved for completed orders, paid invoices, and positive kitchen status updates.
- **Warning Orange (Tertiary):** Used for tickets nearing their time limit or inventory alerts.
- **Neutral Palette:** Uses a deep charcoal and cool gray scale. This creates a soft contrast that allows vibrant status colors to "pop" without overwhelming the user.

For the **Kitchen Display System (KDS)**, use a high-contrast mode where backgrounds for critical tickets shift to full-bleed Warning or Error colors to ensure they are visible from a distance.

## Typography

This design system utilizes **Inter** for its exceptional legibility and extensive support for both Latin and Arabic scripts. The typographic scale is optimized for "at-a-glance" reading.

### Multi-Language Handling
- **LTR (English):** Standard alignment.
- **RTL (Arabic):** When the locale is set to Arabic, the entire typographic hierarchy mirrors. Inter’s tall x-height ensures that Arabic glyphs remain legible alongside English numerals, which are common in pricing and order numbers.

### Specific Roles
- **POS-Price:** A specialized heavy weight and large size for checkout screens.
- **Labels:** Used for status chips and metadata (e.g., table numbers, timestamps).

## Layout & Spacing

The layout is based on an **8px grid system**, ensuring all elements scale proportionally. 

### Grid Model
- **POS/Tablet:** 12-column fluid grid. Elements like "Product Tiles" should span 2-3 columns depending on the screen size to maintain a minimum touch target of 48x48px.
- **Kitchen Display (KDS):** A horizontal-scroll "Kanban" style layout with fixed-width columns (320px) to represent order tickets.
- **Back-Office/Desktop:** A fixed sidebar (280px) with a fluid content area for data-heavy tables and analytics.

### Spacing Rhythm
Standardized 16px gutters provide enough "breathing room" to prevent accidental taps on touchscreen terminals. Use 24px margins on tablets to provide a safe grip area for handheld POS devices.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** rather than heavy shadows, keeping the interface clean and enterprise-grade.

- **Level 0 (Background):** Deepest charcoal (#0F172A). Used for the main application canvas.
- **Level 1 (Surface):** Slightly lighter (#1E293B). Used for sidebars and persistent navigation.
- **Level 2 (Cards):** Elevated containers (#334155). This level uses a very subtle ambient shadow (0px 4px 12px rgba(0,0,0,0.3)) to separate active tickets or modal windows from the background.
- **Outlines:** In high-density areas (like order lists), use 1px solid borders (#334155) instead of shadows to maximize space and maintain a sharp, technical look.

## Shapes

The design system uses a **Rounded** shape language to balance the "industrial" feel of a restaurant tool with modern software expectations.

- **Components:** Buttons, Input Fields, and Cards use a standard 0.5rem (8px) radius.
- **Large Containers:** Modals and Sidebar panels use a 1rem (16px) radius to create clear visual containment.
- **Status Pills:** Utilize a full "pill" radius for immediate recognition as a non-interactive status indicator.

## Components

### Buttons & Touch Targets
- **Primary Action:** Solid "Action Blue" with white text. Minimum height of 48px for POS accessibility.
- **Quantity Adjusters:** Large "+" and "-" buttons (64px) to accommodate rapid input in busy environments.

### Input Fields
- **Search & Data Entry:** Dark-filled backgrounds with a 1px border. On focus, the border transitions to Action Blue with a 2px stroke.

### Cards & Tickets
- **KDS Tickets:** A header section displaying "Table Number" and "Timer." The body lists items. Use a high-contrast stripe on the left edge of the card to denote priority or order type (Dine-in vs. Delivery).

### Chips & Badges
- **Status Indicators:** Small, high-contrast labels for "Paid," "Pending," or "Void." In RTL layouts, these should be positioned to the left of the item text.

### Navigation
- **Sidebar:** Icons-only on mobile/tablet to save space; labels appear on desktop. Ensure icons are clear and unambiguous (e.g., Chef Hat for KDS, Receipt for POS, Chart for Analytics).