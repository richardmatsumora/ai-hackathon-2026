---
name: Meet is Murder Design System
colors:
  surface: '#16130b'
  surface-dim: '#16130b'
  surface-bright: '#3d392f'
  surface-container-lowest: '#110e07'
  surface-container-low: '#1f1b13'
  surface-container: '#231f17'
  surface-container-high: '#2d2a21'
  surface-container-highest: '#39342b'
  on-surface: '#eae1d4'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#eae1d4'
  inverse-on-surface: '#343027'
  outline: '#99907b'
  outline-variant: '#4d4635'
  surface-tint: '#ebc246'
  primary: '#ffe8ad'
  on-primary: '#3d2f00'
  primary-container: '#f2c94c'
  on-primary-container: '#6b5400'
  inverse-primary: '#745b00'
  secondary: '#8ccdff'
  on-secondary: '#00344e'
  secondary-container: '#2899d8'
  on-secondary-container: '#002d44'
  tertiary: '#ffe3e1'
  on-tertiary: '#68000e'
  tertiary-container: '#ffbdb9'
  on-tertiary-container: '#a6242a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe08b'
  primary-fixed-dim: '#ebc246'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#8ccdff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004b6f'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#8e101c'
  background: '#16130b'
  on-background: '#eae1d4'
  surface-variant: '#39342b'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: spaceGrotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: spaceGrotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: spaceGrotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  caption:
    fontFamily: spaceGrotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built on a "Noir Detective" aesthetic, leaning heavily into **Brutalism** and **Tactile** design movements. The brand personality is cynical, authoritative, and obsessively organized—treating every meeting as a "crime scene" that needs to be processed with forensic precision.

The emotional response should be one of focused urgency. By using high-contrast elements and gritty textures, the UI moves away from the sterile friendliness of modern SaaS and toward an opinionated, investigative atmosphere. It prioritizes information density and hierarchy, mimicking a classified dossier or a private investigator’s workbench.

## Colors

The palette is strictly dark-mode by default, utilizing a "Void and Chrome" approach. The base is an abyssal black (#0D0D0D) for the primary background to minimize eye strain and maximize the impact of accent colors.

- **Caution Yellow (#F2C94C):** Used for primary actions and "active" states. It represents the tape surrounding a crime scene.
- **Forensic Blue (#2D9CDB):** Reserved for data points, timestamps, and "evidence" metadata.
- **Blood Red (#EB5757):** Reserved for destructive actions, "murdered" meetings (cancelled), and critical alerts.
- **Neutrals:** Grays are used for structural containers and dividers to create depth without breaking the noir atmosphere.

## Typography

This design system utilizes a high-contrast typographic pairing to evoke a "dossier" feel. 

**Inter** is the primary headline face, set with heavy weights and tight tracking to create a sense of dominance and urgency. **Space Grotesk** serves as the functional workhorse, providing a geometric, technical feel that mimics teletype machines and forensic reports. All labels should be set in Space Grotesk with a slight monospaced rhythm to emphasize the data-heavy nature of the app.

## Layout & Spacing

The layout follows a **Fixed Grid** model. On desktop, the interface is contained within a 12-column grid with 24px gutters. The rhythm is strictly 8px-based to maintain a mathematical, "ledger" appearance.

Layouts should favor asymmetry where possible to enhance the "investigative" feel—for instance, a wide main "evidence" area paired with a narrow "sidebar dossier." Content should be contained in clearly defined modules with consistent padding (24px) to ensure legibility against the dark backgrounds.

## Elevation & Depth

Hierarchy is established through **Bold Borders** and **Hard Shadows** rather than soft blurs. 

1. **Layers:** Use tonal layering (moving from #0D0D0D to #1A1A1A) to lift containers.
2. **Shadows:** Avoid ambient blurs. Instead, use "Hard-Drop" shadows (e.g., 4px offset, 0 blur, 100% opacity) in Caution Yellow or pure Black to give elements a physical, "stamped" quality.
3. **Texture:** A subtle 2-3% noise/grain overlay should be applied to all primary surfaces to simulate aged paper or film stock.
4. **Outlines:** All containers must have a 1px or 2px solid border (High-contrast Gray or Caution Yellow) to separate information nodes.

## Shapes

The shape language is a contradiction of "soft interiors, sharp exteriors." While individual UI elements like chips or badges may use a `rounded-lg` (0.5rem) setting to feel like physical tabs, main containers and buttons should remain on the `soft` (0.25rem) setting.

This slight rounding prevents the UI from feeling too hostile while the thick, high-contrast borders maintain a "sharp" visual edge. Icons must be strictly line-art or stencil-style, using consistent 2px stroke weights.

## Components

- **Buttons:** Use a "Stamp" style. Primary buttons are #F2C94C with black text, 0.25rem corners, and a 4px black hard shadow that disappears on "click" (simulating a physical press).
- **Cards (The Case Files):** Containers with a 1px #262626 border. Header sections of cards should have a "Tab" shape at the top left, mimicking a manila folder.
- **Inputs:** Underlined or fully boxed with a "typewriter" cursor. Use Space Grotesk for input text. Active states trigger a Forensic Blue (#2D9CDB) border.
- **Chips (Evidence Tags):** Small, #1A1A1A background with Forensic Blue text and 1px borders. They should look like physical evidence tags attached to data points.
- **Checkboxes:** Square, sharp corners. When checked, they should show a "Red X" or a "Censored" bar rather than a standard checkmark.
- **Progress Bars:** Designed to look like caution tape, with alternating diagonal stripes of Yellow and Black.