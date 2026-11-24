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

PROJECT GALLERY
- The Selected Work section displays all 54 items from the four supplied Drive collections inside the site.
- Category data lives in assets/portfolio-data.js; project media is organized in assets/projects/{posters,logos,presentations,videos}/.
- Poster images are optimized for web display; PDF and video projects open in the in-page project viewer.
- To add work, put the media in its category folder and add a matching entry to assets/portfolio-data.js.
- Horizontal rails support touch swipes, trackpad scrolling and visible arrow controls.

PROFILE AND CERTIFICATE ASSETS
- The portrait image is profile.jpg; turquoise-logo.svg is the existing logo asset.
- Certificate links in the Skills popup should only be added after the matching real certificate file
  is present. The skill data is in script.js; each skill currently has certificate: null.

NOTES
- Theme preference is saved locally in the visitor's browser.
- Sound effects are optional and OFF by default; no background music is used.
- Mobile uses native touch behaviour; the custom cursor is desktop-only.
- Academic grades and IELTS scores are not displayed.
