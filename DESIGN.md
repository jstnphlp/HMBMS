---
name: Clinical Compassion
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#894d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac6200'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  admin-h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  admin-body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  admin-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  public-h1:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  public-h1-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  public-body:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  public-label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  admin-gap: 0.5rem
  admin-padding: 1rem
  public-gap: 1.5rem
  public-padding: 2.5rem
  container-max: 1280px
---

## Brand & Style

The design system is engineered for the dual nature of a Human Milk Bank Management System. It balances clinical precision with maternal warmth, bridging the gap between a high-stakes medical environment and a supportive community service.

The brand personality is **Trustworthy, Efficient, and Nutritious**. 

### Design Styles
- **Admin Interface (Clinical Precision):** Employs a **Minimalist/Corporate** style inspired by high-density data dashboards. It prioritizes information density, utility, and rapid navigation. Visuals are sharp and structured, reducing cognitive load for hospital staff and lab technicians.
- **Public Interface (Maternal Support):** Transitions into a **Soft Modern** style. It utilizes increased whitespace, softer transitions, and approachable typography to create an environment that feels welcoming and safe for milk donors and recipients.

## Colors

The palette is anchored in **Sky 600 (Medical Blue)**, signifying sterilization and professional healthcare standards. **Makati Yellow (Amber 400)** is used sparingly as an energetic accent to highlight "call to action" moments and warm the sterile blue.

- **Primary:** Use for main actions, active states, and clinical branding.
- **Secondary:** Use for secondary CTAs, "Get Involved" buttons for donors, and highlighting success milestones.
- **Surface Scale:** Built on **Slate (50-900)**. Admin views utilize higher contrast (Slate 900 text on 50 background), while Public views use softer mid-tones to reduce visual harshness.

## Typography

This design system utilizes **Inter** across all modules for its exceptional legibility and systematic weight distribution.

- **Admin Logic:** Typography is optimized for high-density layouts. A 14px base ensures maximum data visibility within tables and forms, while 12px labels allow for complex attribute tagging.
- **Public Logic:** Typography scales up to prioritize readability and emotional resonance. Larger 18px body copy ensures accessibility for mothers who may be viewing the site while multitasking or on mobile devices.

## Layout & Spacing

The design system employs a **Fluid Grid** model with two distinct density presets:

### Admin Layout (Precision)
- **Grid:** 12-column fluid grid.
- **Gutter:** 16px (1rem).
- **Margins:** 24px (1.5rem).
- **Philosophy:** Components are tightly packed. Vertical rhythm is strictly managed to keep crucial data "above the fold."

### Public Layout (Generous)
- **Grid:** Centered fixed-width container (max-width: 1280px).
- **Gutter:** 32px (2rem).
- **Margins:** 64px (4rem) on desktop; 20px on mobile.
- **Philosophy:** Uses whitespace as a structural element to guide the user's eye and provide a calm browsing experience.

## Elevation & Depth

Visual hierarchy varies by user intent:

- **Admin (Tonal Layers):** Depth is communicated through subtle border-bottoms and varying shades of Slate background (Slate 50 vs White). Shadows are rarely used, except for temporary pop-overs or dropdown menus, where they are sharp and minimal.
- **Public (Soft Shadows):** Uses **Ambient Shadows**. Surfaces feel elevated and tactile. Shadows are tinted with the primary blue (e.g., `rgba(2, 132, 199, 0.08)`) and feature a high blur radius to create a "cloud-like" feel that complements the maternal theme.

## Shapes

The design system uses a conditional shape logic to match the UI style:

- **Admin Elements:** Strictly **Soft (0.25rem)**. This creates a "New York" clinical feel—organized, professional, and efficient.
- **Public Elements:** Overrides the base to **Rounded (0.5rem)** for cards and buttons. Full-pill shapes (3rem) are used for "Donate" buttons and "Apply" tags to appear more approachable.

## Components

### Buttons
- **Admin:** Small/Medium height, sharp corners, Sky 600 fill or Slate 200 ghost borders.
- **Public:** Large height, Rounded-LG or Pill corners, Sky 600 or Makati Yellow fill with subtle hover lift (transform: translateY(-2px)).

### Input Fields
- **Admin:** High-density, Slate 200 border, focus state uses a 1px Sky 600 ring.
- **Public:** Tall inputs, Slate 100 background, focus state uses a soft glow shadow.

### Cards
- **Medical Cards (Admin):** Bordered, no shadow, header background Slate 50.
- **Donor Cards (Public):** White background, soft blue-tinted shadow, generous internal padding (2rem).

### Status Indicators
- Use a "Chip" format. Admin chips are small with high-contrast text. Public chips are larger with soft pastel backgrounds (e.g., Emerald 50 for success background).

### Data Tables (Admin Only)
- Compact row heights (40px). 
- Alternating row stripes (Slate 50).
- Sticky headers for long logs of milk inventory.