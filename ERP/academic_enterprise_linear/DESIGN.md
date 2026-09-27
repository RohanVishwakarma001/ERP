---
name: Academic Enterprise Linear
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
  on-surface-variant: '#42474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#73777f'
  outline-variant: '#c2c7cf'
  surface-tint: '#3a6188'
  primary: '#002541'
  on-primary: '#ffffff'
  primary-container: '#0b3b60'
  on-primary-container: '#7fa6d0'
  inverse-primary: '#a3caf6'
  secondary: '#bb0112'
  on-secondary: '#ffffff'
  secondary-container: '#e02928'
  on-secondary-container: '#fffbff'
  tertiary: '#00263d'
  on-tertiary: '#ffffff'
  tertiary-container: '#003c5e'
  on-tertiary-container: '#49a9ef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#a3caf6'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#1f496f'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000b'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-canvas: '#F8FAFC'
  surface-subtle: '#F1F5F9'
  surface-pure: '#FFFFFF'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
  text-display: '#0F172A'
  text-body: '#334155'
  text-muted: '#64748B'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-error: '#EF4444'
  status-info: '#0284C7'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  tabular-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an institutional yet high-velocity enterprise SaaS experience tailored for Indian higher education administration. It combines the rigorous architectural cadence of Linear with the refined, trustworthy precision of Stripe, reframing complex academic workflows—admissions, fee structures, faculty allotments, university regulatory compliance, and semester examinations—into an effortless, focused workspace.

The design movement is **Modern Enterprise Minimalist**:
- **Utilitarian Speed & Density:** Optimized spatial density that preserves breathing room while presenting comprehensive academic metrics and tabular ledgers without cognitive fatigue.
- **High-Contrast Trust:** An unyielding commitment to WCAG AAA contrast ratios. Crisp, deep charcoal type against clinical white surfaces reinforces institutional integrity and computational precision.
- **Micro-Refinement:** Ultra-subtle boundary outlines, micro-chamfered corners, and disciplined monochromatic layering with surgical color deployment for status and alerts.

## Colors

The palette is engineered exclusively for a light environment to support prolonged daytime academic administration, faculty grading, and registrar workflows.

- **Primary Action (`#0B3B60`):** An authoritative deep naval blue derived from collegiate insignia. Applied strictly to primary actions, selected navigation items, active tabs, and focused controls.
- **Secondary Accent (`#DC2626`):** A surgical crimson reserved for high-stakes administrative triggers, urgent academic notifications, regulatory deadlines, disciplinary marks, and destructive actions. Never used purely decoratively.
- **Tertiary Information (`#0284C7`):** An analytic sky blue deployed for informative badges, ongoing background syncs, and auxiliary links.
- **Neutral Structure (`#64748B`):** A balanced slate neutral family calibrated to support visual separation without visual weight:
  - `surface-canvas` (`#F8FAFC`): Base application workspace background.
  - `surface-subtle` (`#F1F5F9`): Data table headers, side rail containers, inactive controls.
  - `surface-pure` (`#FFFFFF`): Elevated work surfaces, cards, and modal canvases.
  - `border-subtle` (`#E2E8F0`): Primary structural separator across all cards, cells, and dividers.
- **Feedback & States:** Semantic tokens (`status-success` `#10B981`, `status-warning` `#F59E0B`, `status-error` `#EF4444`, `status-info` `#0284C7`) always pair with a matching 10% opacity wash when applied to badges and indicator rings.

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for prominent headers with **Inter** for dense transactional UI, forms, and data tables.

- **Proportional vs. Tabular Figures:** Enable CSS `font-feature-settings: "tnum" 1, "cv02" 1, "cv03" 1` across all body and tabular roles. This guarantees strict vertical alignment for student roll numbers, fee transaction amounts, CGPA scores, and timetable schedules.
- **Headings:** Set in Plus Jakarta Sans with subtle negative tracking (`-0.01em` to `-0.025em`) to produce a modern, polished editorial tone.
- **Micro Labels:** Rendered in `label-sm` or `label-md` with positive letter spacing (`0.02em` to `0.04em`) and uppercase transformation where applicable (e.g., column headers, status caps).

## Layout & Spacing

The architecture operates on an 8-point baseline grid with a 4-point sub-grid for internal component micro-alignment.

- **Grid Model:** Fluid 12-column layout on desktop viewports (1280px+) with an adaptive fixed-rail navigation (256px expanded, 68px collapsed). Main content area caps at a maximum width of 1600px to maintain line-length legibility on ultra-wide academic monitors.
- **Breakpoints:**
  - **Desktop (`>= 1024px`):** 12 columns, `gutter-lg` (32px), `margin-desktop` (40px). Side rails remain pinned.
  - **Tablet (`768px – 1023px`):** 8 columns, `gutter` (24px), `margin` (32px). Secondary rails convert to slide-over drawers.
  - **Mobile (`< 768px`):** 4 columns, `gutter-sm` (16px), `margin-mobile` (16px). Cards stack vertically; complex data tables transform into card lists.
- **Vertical Rhythm:** Strict rhythm driven by `space-xs` (4px), `space-sm` (8px), `space-md` (16px), `space-lg` (24px), and `space-xl` (32px).

## Elevation & Depth

Visual hierarchy rejects exaggerated drop shadows in favor of a **Layered Surface-Border Architecture**:

- **Level 0 (Canvas Base):** `surface-canvas` (`#F8FAFC`). No shadow, no border. The base substrate.
- **Level 1 (Card & Content Blocks):** `surface-pure` (`#FFFFFF`) with a 1px continuous hairline outline using `border-subtle` (`#E2E8F0`) and a micro-shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Interactive Floating States & Dropdowns):** `surface-pure` (`#FFFFFF`) framed by `border-strong` (`#CBD5E1`) with a sharp elevation shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Command Palettes):** Layered above a darkened scrim (`rgba(15, 23, 42, 0.45)` with 4px backdrop blur). Elevation: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`. Border: 1px solid `border-subtle`.

## Shapes

The design system adopts a refined rounded language (Level 2) that softens enterprise density while maintaining structure:

- **Inputs & Compact Buttons:** 8px (`0.5rem`) corner radius for high tactile accuracy.
- **Cards & Data Panels:** 12px to 14px corner radius, balancing structural grid alignment with modern edge smoothing.
- **Modals & Dialogs:** 16px (`1rem`) corner radius.
- **Pill Accents:** Fully rounded (`9999px`) reserved strictly for status badges, metric indicators, and user avatars.

## Components

### Buttons
- **Primary:** Background `#0B3B60`, foreground `#FFFFFF`, font weight 600. Padding: 8px 16px for medium (36px height). Subtle 1px inset top-highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`. Hover: `#082C49`. Active: `#06223A`.
- **Secondary / Outline:** Background `#FFFFFF`, 1px border `#E2E8F0`, foreground `#0F172A`. Hover: background `#F8FAFC`, border `#CBD5E1`.
- **Destructive:** Background `#DC2626`, foreground `#FFFFFF`. Hover: `#B91C1C`.
- **Ghost:** Transparent background, foreground `#334155`. Hover: `#F1F5F9`.

### Input Fields & Selects
- Height: 38px. Background `#FFFFFF`, border 1px solid `#E2E8F0`, corner radius 8px, padding 0 12px.
- Focus: Border color `#0B3B60` with a 3px outer ring in `rgba(11, 59, 96, 0.12)`.
- Label placed outside top, rendered in `label-md` (`#334155`).

### Data Tables
- Header: Height 40px, background `#F8FAFC`, bottom border 1px solid `#E2E8F0`, text `label-sm` uppercase `#64748B`.
- Row: Height 48px standard (38px compact mode), background `#FFFFFF`, bottom border 1px solid `#F1F5F9`.
- Row hover: `#F8FAFC` transition 120ms ease.

### Badges & Chips
- Corner radius: `9999px`. Padding: 2px 8px. Height: 22px.
- **Success:** Background `rgba(16, 185, 129, 0.1)`, text `#047857`, border `1px solid rgba(16, 185, 129, 0.2)`.
- **Warning:** Background `rgba(245, 158, 11, 0.1)`, text `#B45309`, border `1px solid rgba(245, 158, 11, 0.2)`.
- **Error:** Background `rgba(239, 68, 68, 0.1)`, text `#B91C1C`, border `1px solid rgba(239, 68, 68, 0.2)`.
- **Neutral:** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Cards & Panels
- Background `#FFFFFF`, border 1px solid `#E2E8F0`, border-radius 12px.
- Header divided by a 1px border `#F1F5F9` separator when containing actionable button sets. Padding: 20px.

### Checkboxes & Radios
- Size: 16px x 16px. Border 1px solid `#CBD5E1`, border-radius 4px (checkbox) or 50% (radio).
- Checked state: Background `#0B3B60`, border `#0B3B60`, white icon.

### Academic ERP-Specific Components
- **Semester Timeline Bar:** Horizontal step indicator showing syllabus progression, assignment milestones, and mid-term / end-term exam locks with `#0B3B60` progress fill.
- **Fee Ledger Callout:** High-density breakdown card featuring tabular amounts, late fee alerts in `#DC2626`, and verified challan download triggers.