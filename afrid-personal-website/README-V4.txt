AMJ PERSONAL WEBSITE — V4 REVIEW BUILD

FILES
- index.html
- styles.css
- script.js

To preview the site, place all three files in the same folder and open index.html in a browser.

V4 TRANSITION UPDATE
- 3D skill cards now use a smoother, longer easing curve with a stronger active-card glow.
- The carousel auto-advances every 4.5 seconds and pauses while hovered, focused, touched, or while its details dialog is open.
- Mouse/pen drag uses pointer capture and suppresses accidental clicks after a swipe.
- Touch swipe remains enabled and vertical page scrolling is preserved.
- The dark-theme background includes subtle animated turquoise/icy star streaks; reduced-motion settings disable them.
The site is built as a static HTML/CSS/JavaScript website and does not need a build command.

IMPORTANT: Do not delete cv.pdf or any existing files you still need. When you approve V4,
replace only index.html, styles.css and script.js in your existing website folder. Keep the
same Vercel root directory (afrid-personal-website).

MANUAL ASSET SLOTS
The new V4 intentionally uses empty placeholders instead of sample images or fake documents.
When ready, create an assets folder next to index.html and add:
- assets/profile.png          (your transparent portrait PNG)
- assets/turquoise-logo.png   (your TURQUOISE logo)
- assets/projects/            (your real project preview images)
- assets/certificates/        (your verified certificates and supporting documents)

The portrait placeholder in index.html contains a comment showing where to insert the image.
The remaining logo, project and document areas are visual placeholders and do not open broken links.
Certificate links in the Skills popup should only be added after the matching real certificate file
is present. The skill data is in script.js; each skill currently has certificate: null.

NOTES
- Theme preference is saved locally in the visitor's browser.
- Sound effects are optional and OFF by default; no background music is used.
- Mobile uses native touch behaviour; the custom cursor is desktop-only.
- Academic grades and IELTS scores are not displayed.
