# Private site-wide type controls (editor only)

## Goal
Add an on-page control panel that lets you adjust the type across **every page** live — size, leading, letter spacing — without editing code. The panel is **private to you**: visitors to your published site never see it, and the type they see is whatever you saved.

## Who can see it

- Visible while you're editing in the Lovable preview.
- On the published site it stays hidden unless you open a private link with a secret key in the address (for example `yoursite.com/?edit=YOUR-KEY`), which then unlocks the panel just for your browser.
- The key is stored as a private setting, never printed in the page for normal visitors.

## What you'll get

A small settings panel (opens from a discreet button in the sticky nav, next to the light/dark toggle) with sliders for:

- **Base text size** — scales body copy and nav text together.
- **Heading size** — project titles and headlines.
- **Intro / display size** — the big intro line on the Work page.
- **Leading (line spacing)** — separate sliders for body and headings.
- **Letter spacing** — subtle range for headings.
- **Reset** — back to the designed defaults.
- **Save as site default** — writes your current values so all visitors see them.

Adjustments apply instantly across About and Work.

## How it works

1. A shared type-settings provider stores the values and writes them as CSS variables on the page root: `--type-body-size`, `--type-heading-size`, `--type-display-size`, `--type-body-leading`, `--type-heading-leading`, `--type-heading-tracking`.
2. `src/styles.css` defines those variables with today's designed values as defaults (using `clamp()` so responsive scaling is preserved) plus utility classes `.type-body`, `.type-heading`, `.type-display` that read them.
3. About and Work text swaps fixed size/leading utilities for those classes, so every text block responds.
4. Your live tweaks persist in your own browser and apply before first paint (same trick as the light/dark choice) so there's no flash.
5. "Save as site default" writes the values into the shared defaults file so published visitors get them; without saving, your tweaks stay local to you.
6. Gate: the panel renders only when the app is running in development, or when the secret key check passes. The check runs on the server against a private value, so the key never ships in the page.

## Out of scope
- Per-page overrides — settings are global.
- Changing which typefaces are used (the nav name keeps its cycling behavior).
- Real user accounts or logins.

## Technical notes
- New: `src/components/TypeSettingsProvider.tsx`, `src/components/TypeSettingsPanel.tsx`, `src/lib/editor-gate.functions.ts` (server fn comparing `?edit=` against a server-only `EDITOR_KEY` secret with a timing-safe hash compare, setting an encrypted session flag via `useSession` with a `SESSION_SECRET`).
- Edits: `src/styles.css`, `src/routes/__root.tsx` (provider + pre-paint script + gate check), `src/routes/about.tsx`, `src/routes/work.tsx`.
- Secrets needed: `EDITOR_KEY` (your choice, or I generate one) and `SESSION_SECRET` (generated).
- Values stored as multipliers (0.75x–1.75x) and unitless leading (1.0–2.2) in one JSON local-storage entry; saved defaults land in a committed `src/config/type-defaults.ts`.
