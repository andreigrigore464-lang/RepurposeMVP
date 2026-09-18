# Design System: Luminous Studio

<!-- impeccable:design-schema 1 -->

## Design Philosophy

Repurpose Studio is an expressive, visual-first creator studio designed for creators, founders, and B2B marketing teams. The aesthetic balances high-density creative workbench efficiency with luminous modern depth—drawing inspiration from Sui, Finex, and Post Once.

---

## 1. Color System & Tokens

### Canvas & Backgrounds
* **Canvas Obsidian**: `#08090d` (Deepest canvas background)
* **Surface Midnight**: `#0e1017` (Primary surface for cards, floating sidebars, and panels)
* **Surface Elevated**: `#151824` (Elevated interactive controls, hover states, input fields)
* **Surface Frosted**: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(16px)`

### Primary Accents (Atmosphere & Actions)
* **Cobalt Aura / Primary**: `#2563eb` (`oklch(0.55 0.22 260)`) – Primary buttons, active highlights, key links
* **Electric Cyan Glow**: `#38bdf8` (`oklch(0.78 0.15 220)`) – Ambient bloom gradients, glowing badges
* **Electric Chartreuse / Energy Accent**: `#a3e635` / `#ccff00` – High-visibility badges, live status dots, conversion triggers

### Borders & Dividing Lines
* **Border Subtlest**: `rgba(255, 255, 255, 0.07)` – Standard card boundaries
* **Border Elevated**: `rgba(255, 255, 255, 0.14)` – Hovered borders, active drawers
* **Border Luminous**: `linear-gradient(135deg, rgba(56, 189, 248, 0.4), rgba(37, 99, 235, 0.1), rgba(255, 255, 255, 0.05))`

### Text & Foreground Hierarchy
* **Foreground Bright**: `#ffffff` (Headings, primary values, active icons)
* **Foreground Muted**: `#94a3b8` / `#a1a1aa` (Body copy, secondary labels)
* **Foreground Faint**: `#64748b` (Tertiary metadata, placeholder text, hints)

---

## 2. Typography & Rhythm

* **Display Headings (`--font-display` / `Plus Jakarta Sans`)**:
  * Weights: `600`, `700`, `800`
  * Tight geometric tracking (`tracking-tight` / `-0.025em` to `-0.035em`)
  * Applied to page headers, hero titles, bento grid titles, and modal headers.
* **Body & Interface (`--font-sans` / `Inter`)**:
  * Weights: `400`, `500`, `600`
  * Balanced leading (`leading-relaxed` / 1.6), optimal reading measure (45–70ch).
  * Applied to body copy, table text, input labels, tooltips, and descriptions.
* **Monospace Telemetry (`--font-mono` / `JetBrains Mono`)**:
  * Weights: `400`, `500`, `600`
  * Tabular numbers (`tabular-nums`), aspect ratio badges (`1:1`, `4:5`), coordinates, step numbering, hex color codes, and layer IDs.

---

## 3. Surface & Materiality

* **Glass Panels (`.glass-panel`)**:
  * `background: rgba(14, 16, 23, 0.75)`
  * `backdrop-filter: blur(16px)`
  * `border: 1px solid rgba(255, 255, 255, 0.08)`
  * `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37)`
* **Pill Navigation & Badges**:
  * Fully rounded (`rounded-full`) with subtle inner light highlight `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`.
* **Card Radii**:
  * Small: `rounded-xl` (12px) for inputs, buttons, and sub-items.
  * Medium: `rounded-2xl` (16px) for standard cards and drawers.
  * Large: `rounded-3xl` (24px) for modals and marquee visual stages.

---

## 4. Motion & Micro-Interactions

* **Card Hover Sweep (`CardHoverEffect`)**: Fluid cursor-follow backdrop highlight on grid items.
* **Animated Border Gradient (`HoverBorderGradient`)**: Luminous rotating light beam around primary CTAs and active cards.
* **Ambient Radial Glow (`AmbientGlow`)**: Soft atmospheric blue/cyan light bloom behind page heroes and visual stages.
* **Transition Standard**: `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)` (ease-out).

---

## 5. Surface Principles

* **Workflows & New Flow**: Visual-first canvas is the hero; slide preview is prominent and responsive; parameters dock cleanly to the side; slide timeline enables quick scrubbing.
* **Templates**: High-craft visual cards with live hover states, aspect ratio badges, and slide layer inspectors.
* **Inbox**: Live triage stream with animated status nodes and fast repurpose actions.
* **Settings**: Refined segmented toggles and clear telemetry cards.
* **Landing Showcase**: Floating frosted navigation, interactive 3-step pipeline visualizer, and live studio launch transitions.
