---
target: src/app/(dashboard)/settings/page.tsx
total_score: 36
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Work\\AI\\RepurposeMVP\\src\\app\\(dashboard)\\settings\\page.tsx"
target_fingerprint: "sha256:a512c67fbe7d3b1a36062fdcee291f47304ff255dac8392f7c5b4adc56895de4"
target_path: "D:\\Work\\AI\\RepurposeMVP\\src\\app\\(dashboard)\\settings\\page.tsx"
timestamp: 2026-09-18T17-28-11Z
slug: src-app-dashboard-settings-page-tsx
---
# Design Critique: Engine & Studio Settings (`src/app/(dashboard)/settings/page.tsx`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Live telemetry pill and active selection glows provide immediate feedback |
| 2 | Match System / Real World | 4 | Natural terminology (layer mappings, heuristics, deterministic vs autonomous) |
| 3 | User Control and Freedom | 3 | Easy mode switching, but setting is transient without persistent save |
| 4 | Consistency and Standards | 4 | Follows Luminous Studio tokens, glass panels, and typography hierarchy |
| 5 | Error Prevention | 4 | Prominent contextual warning card rendered when heuristic mode is active |
| 6 | Recognition Rather Than Recall | 4 | Key tradeoffs and bullet points visible directly on each selection card |
| 7 | Flexibility and Efficiency | 3 | Clean 2-card selection, but lacks quick test preview against templates |
| 8 | Aesthetic and Minimalist Design | 4 | High visual craft, balanced negative space, clean typography pairing |
| 9 | Error Recovery | 3 | Clear warning text, though no inline troubleshooting dry-run |
| 10 | Help and Documentation | 3 | Explanatory copy is clear; link to Template Studio is prominent |
| **Total** | | **36/40** | **Excellent** |

## Design Specificity Verdict

**LLM Assessment**: The Settings surface is well-grounded in the Repurpose Studio creative workbench identity. Rather than presenting generic API configuration forms, it focuses on the core domain problem: AI template layer resolution (explicit deterministic layer mapping vs autonomous heuristic auto-detection).

**Deterministic Scan**: Clean (`0` anti-patterns detected). Token usage, contrast, and layout conventions adhere to the design system.

## Overall Impression
Polished, focused, and intuitive. It clearly demystifies how Gemini maps content onto Templated.io canvas layers. The primary opportunities are keyboard accessibility (semantic radio roles) and persistent storage.

## What's Working
1. **Telemetry & Live Status**: The header features an active `Gemini & Templated.io Online` pulsing badge that reassures users the engine is operational.
2. **Tradeoff Transparency**: The two strategy cards clearly contrast "Recommended / Deterministic" with "Autonomous / Fast prototyping", giving founders and creators full confidence.
3. **Contextual Alert Disclosure**: Switching to Heuristic Auto-Detection dynamically reveals an amber advisory explaining potential font-hierarchy edge cases.

## Priority Issues
- **[P1] Keyboard Accessibility & Semantic Radio Roles**:
  - *Why it matters*: The strategy cards use clickable `div` elements without `role="radio"`, `aria-checked`, or `tabIndex={0}`, blocking keyboard-only and screen reader navigation.
  - *Fix*: Convert cards into an accessible radio group with keyboard focus rings.
  - *Suggested command*: `/impeccable harden src/app/(dashboard)/settings/page.tsx`
- **[P2] Settings Persistence & Save Feedback**:
  - *Why it matters*: Selecting a resolution mode modifies local React state only; page reload resets the choice.
  - *Fix*: Store preference in `localStorage` or user settings store and display a subtle "Saved" confirmation indicator.
  - *Suggested command*: `/impeccable polish src/app/(dashboard)/settings/page.tsx`
- **[P3] Dry-Run Layer Resolution Inspector**:
  - *Why it matters*: Users cannot immediately see how heuristic resolution calculates font hierarchy without running a live batch.
  - *Fix*: Add an expandable preview card testing the active strategy against a sample template.
  - *Suggested command*: `/impeccable delight src/app/(dashboard)/settings/page.tsx`

## Persona Red Flags
- **Sam (Accessibility)**: Cannot toggle between layer resolution strategies using keyboard Tab / Spacebar due to non-interactive `div` container markup.
- **Alex (Power User)**: Wants persistent setting storage and a dry-run test tool without having to initiate a full workflow run.
- **Jordan (First-Timer)**: May wonder if API keys need to be configured here or if they are managed in environment variables.

## Questions to Consider
- Should we persist the resolution mode directly to `localStorage` with a subtle toast/indicator?
- Would an interactive "Sample Layer Inspector" help clarify how heuristics detect title vs body text?
