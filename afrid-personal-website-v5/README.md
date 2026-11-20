# JOY V5 — Digital Experience

A separate V5 implementation of the personal portfolio. V4 remains in its original folder and is not modified.

## Project layout
- `index.html`: entry screen, profile transformation and 12 full-screen scenes.
- `styles.css`: responsive visual system, transitions, themes and interaction states.
- `script.js`: scene navigation, rotating skill orbit, filters, sound, theme and accessibility behavior.
- `assets/profile.jpg`: the existing V4 portrait asset, reused without alteration.
- `assets/cv.pdf`: the existing CV, reused without alteration.

## Preview locally
Open `index.html` in a modern browser, or run a static server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Experience controls
- Scroll wheel / trackpad: move between scenes.
- Swipe: move forward/back on touch screens.
- Quick navigation: jump directly to a scene.
- Keyboard: Arrow Up/Down, Page Up/Down, Home and End.
- Skills: drag the circular orbit, use the arrows, or filter by category.
- Sound effects: opt-in and OFF by default.
- Theme: dark by default; the visitor's preference is remembered locally.

## Content integrity
Project cards are descriptive placeholders based on the experience already documented in V4. They are labelled as awaiting original project-preview assets. Credential areas link only to the supplied certificates folder or clearly indicate that verified files still need to be added. The NUCB status is written as an incoming April 2027 Global BBA student, not as someone already studying in Japan.

## Deployment
This folder is intended to be used as the root directory of a separate Vercel preview/project after local review. Do not change the existing V4 deployment or production domain until V5 is tested and approved.
