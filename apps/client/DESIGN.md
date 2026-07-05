---
name: PitchOS Design System
description: Tactical P2P terminal for decentralized football operations
colors:
  primary: "oklch(0.72 0.16 150)"
  background: "oklch(0.12 0.01 220)"
  foreground: "oklch(0.98 0.005 220)"
  card: "oklch(0.15 0.015 220)"
  border: "oklch(0.22 0.015 220)"
  gold: "oklch(0.76 0.14 75)"
  red: "oklch(0.62 0.18 25)"
typography:
  display:
    fontFamily: "var(--font-inter), sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: "1.25"
  body:
    fontFamily: "var(--font-inter), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-container:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: PitchOS

## 1. Overview

**Creative North Star: "The Sovereign Terminal"**

The PitchOS visual system is a high-density, cryptographic cockpit engineered for self-sovereign coaches and local grassroots teams. Built with a tactical terminal aesthetic, it prioritizes cryptographic clarity, lightning-fast navigation, and absolute precision. The system presents offline connectivity states, keys, ledger activities, and tactical metrics with the density and authority of a specialized terminal console.

We explicitly reject the generic enterprise SaaS aesthetic. There are no pastel cards, no soft glowing drop shadows, and no warm cream-colored backgrounds. Instead, the interface relies on deep slate backdrops, crisp high-contrast border boundaries, and sharp accent tags that structure information dynamically.

**Key Characteristics:**
- **Terminal High Density**: Information is packed tight, using structured grids and thin borders to separate content areas rather than blank space.
- **Offline Visibility**: Clear indicator states mapping P2P connectivity, sync streams, and cryptographic keys.
- **Tactical Utility**: Monospaced labels, precise jersey coordinates, and high-visibility status tags.

## 2. Colors

The PitchOS color scheme is optimized for outdoor readability (e.g., coaches checking the screen on a sunny pitch side) and uses OKLCH color rules canonically.

### Primary
- **Sovereign Pitch Green** (oklch(0.72 0.16 150)): Used for primary actions, success sync states, and highlighting key player performance variables. In light mode, it defaults to a deep green (oklch(0.205 0 0)).

### Neutral
- **Cyber Pitch Black** (oklch(0.12 0.01 220)): The core dark mode page background. Deep, clean, and distraction-free.
- **Shatterproof Slate Card** (oklch(0.15 0.015 220)): Used as background color for panels, lists, and forms.
- **Terminal Phosphor White** (oklch(0.98 0.005 220)): The default body text and primary ink color.
- **Tactical Border Grey** (oklch(0.22 0.015 220)): Used for crisp structural outlines.

### Named Rules
**The Rarity of Pitch Green Rule.** Sovereign Pitch Green is an accent color and must be used on ≤10% of any single viewport. Its scarcity ensures that critical actions and sync notifications stand out instantly.

## 3. Typography

**Display Font:** Inter (with system-ui fallback)
**Body Font:** Inter (with sans-serif fallback)
**Label/Mono Font:** Geist Mono (for wallet DIDs, keys, and tabular states)

### Hierarchy
- **Display** (ExtraBold, 1.875rem (30px), 1.25): Used for main page headers, application titles, and high-level score figures.
- **Headline** (Bold, 1.25rem (20px), 1.3): Used for cards, sections, and panel headers.
- **Title** (SemiBold, 1rem (16px), 1.4): Used for sub-sections and roster items.
- **Body** (Regular, 0.875rem (14px), 1.5): Used for informational passages and descriptions. Max line length is restricted to 70ch.
- **Label** (Medium, 0.75rem (12px), 1.2, uppercase): Monospaced elements, status badges, and table column titles.

### Named Rules
**The Mono Identity Rule.** All cryptographic addresses, Transaction hashes, DIDs, and live score event logs must be typeset in the monospaced font to maintain technical transparency and developer posture.

## 4. Elevation

The system is flat by default, utilizing flat colored layers and thin border boundaries instead of drop shadows.

### Named Rules
**The Flat Boundary Rule.** We forbid the use of drop shadows to simulate depth. Instead, elevation is strictly structured via flat containment layers (`--card`) outlined with a thin (1px) high-contrast border (`--border`).

## 5. Components

### Buttons
- **Shape:** Rounded corners (8px radius).
- **Primary:** Sovereign Pitch Green background with Cyber Pitch Black text. Standard padding is `8px 16px` (`h-8`).
- **Hover / Focus:** Opacity shifts to 80% on hover, border-ring highlight focus outline.
- **Outline:** Transparent background with 1px border. Hover transitions to slate gray background.

### Chips
- **Style:** Compact pill layout (full round 9999px), background matches accent or status (green, red, gold) at low opacity (10-20%) with solid color border and matching text.

### Cards / Containers
- **Corner Style:** Rounded-xl (12px radius).
- **Background:** Shatterproof Slate Card background.
- **Shadow Strategy:** 0px shadows.
- **Border:** Thin solid border (`--border`) to contain items cleanly.

### Inputs / Fields
- **Style:** Dark background (Cyber Pitch Black), thin outline border, 12px padding.
- **Focus:** Sharp outline transition to Sovereign Pitch Green.

### Navigation
- **Style:** Flat border-bottom sticky header, tabbed nav with high-contrast text transitions and bottom border highlights for active pages.

## 6. Do's and Don'ts

### Do:
- **Do** format all DIDs and transaction hashes using a monospaced font family for terminal consistency.
- **Do** align columns in player statistics tables using tabular numerals.
- **Do** use high-contrast text ratios exceeding 4.5:1.

### Don't:
- **Don't** use border-left or border-right accent stripes on cards to mark alert status (prohibited).
- **Don't** use radial or linear gradient overlays as backgrounds. Keep colors solid and flat.
- **Don't** add box-shadows to card items; rely on flat colors and distinct 1px border lines.
