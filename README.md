# दीपोत्सव (Deepotsava) — A celebration of light

A complete, responsive Diwali experience built with React 19, Vite, Tailwind CSS 4, Motion, GSAP, Three.js / React Three Fiber, Lucide, and HTML Canvas. No backend, API keys, or runtime external services are required. The visible Hindi brand is **दीपोत्सव** (Deepotsava).

## Run locally

Use Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production preview:

```sh
npm test
npm run build
npm run preview
```

## Deploy to Vercel

Import this folder as a Git repository in Vercel. Select **Vite**, use `npm run build` as the build command and `dist` as the output directory. No environment variables or backend configuration are needed. You can also run `npx vercel` from this directory with your own Vercel account.

## Experiences

- A lazy-loaded, procedural brass 3D diya, warm point lighting, natural flame flicker, and an ornate rotating SVG rangoli. A CSS diya is used while loading and if WebGL is unavailable.
- Twelve individually lit diyas with blessings, ascending golden sparks, an accurate session counter, and reset. Each newly lit diya plays an original, soft 0.75-second ignition chime; already-lit diyas stay silent. The chime plays only after a lighting gesture, independently of the optional background music. Session storage retains lights across reloads in the same browser tab; storage restrictions fall back to in-memory state.
- The hero fireworks link opens the dedicated `/fireworks` playground. The original homepage sky taps, keyboard-accessible single-firework button, and Grand Celebration remain available. Particle counts and pixel density are reduced on mobile; the renderer sleeps after bursts finish.
- Personalized greetings in Traditional, Romantic, Family, and Friends styles. Generated cards support clipboard copy, a native Canvas PNG download, and encoded WhatsApp links. WhatsApp opens a draft; the visitor chooses whether to send it.
- Five wishes, including Hindi, with independent copy/share controls.
- Hidden surprises: click either lantern, the crescent moon, or the golden gift. The gift opens a focus-managed native modal with a blessing personalized using the sender’s name.
- Original pentatonic instrumental audio generated with Web Audio oscillators. Off by default; playback begins only after pressing the visible sound control. No copyrighted recordings or external audio files.
- Celebrate Again resets all diyas, greeting inputs, the generated card, and surprise state, then returns to the hero. Music remains under the visitor’s music control.

## Accessibility and performance

Semantic sections, labeled inputs, native radio controls, pressed-state diya buttons, keyboard-visible focus, a skip link, live status messages, touch-friendly controls, and a native dialog with Escape/focus handling. `prefers-reduced-motion` disables continuous CSS/3D motion and scroll entrances and reduces celebratory bursts. Heavy Three.js code is split from the initial bundle; the 3D render loop pauses offscreen. Fonts are bundled locally with `font-display: swap`. All artwork and music are procedural and original.

Clipboard access requires HTTPS or localhost; if unavailable, a message explains manual copying. PNG export includes wrapping for long names. Modern browsers with Canvas support are recommended. WebGL is optional.

## Source

- `src/App.jsx`: sections, state, forms, and interactions
- `src/components/DiyaScene.jsx`: lazy-loaded Three.js scene and fallback
- `src/components/Fireworks.jsx`: bounded particle effects
- `src/components/Rangoli.jsx`: reusable original SVG artwork and CSS diya
- `src/components/Music.jsx`: original Web Audio composition
- `src/lib/greetings.js`: greeting, sharing, and PNG logic
- `src/style.css`: responsive design, visual tokens, and motion preferences

Implementation references: [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite), [React Three Fiber Canvas](https://r3f.docs.pmnd.rs/api/canvas).

## Verification

`npm test` runs four focused greeting/encoding/wrapping checks and a complete DOM interaction journey. The journey exercises session persistence and duplicate lighting, all greeting styles, copy/download/share actions, sky and surprise triggers, music on/off, mobile navigation state, and celebration reset. WebGL, motion rendering, clipboard, Canvas export, and audio platform APIs are substituted in that DOM test; it does not prove visual appearance, GPU rendering, audio quality, or real-device behavior. Browser visual QA was unavailable in the development session and should be performed before public release.

## Phone-focused layout

Phone layouts use a compact sticky navigation bar, single-column wish cards, full-width hero actions, 44–52px touch controls, and larger reading text. Form inputs use 16px text to avoid automatic iOS focus zoom. Sharing controls have separate tap areas, and greeting styles use a two-column selector. Safe-area insets account for notches and home indicators; the gift dialog scrolls within the visible viewport. Tablet wish galleries use two columns.

On phones and lower-powered devices, the 3D scene uses a 30fps demand render loop while visible, lower geometry detail, and 1x pixel density. Fireworks also use 1x density and a maximum of 360 active particles on phones. Continuous decorative particles are reduced on small screens. The mobile menu closes after navigation, an outside tap, or Escape.

## Virtual Fireworks Garden (`/fireworks`)

The homepage’s **Celebrate with Fireworks** link opens a lazy-loaded React Router page with a cinematic fade. Direct links and refreshes are supported by `vercel.json`. The existing homepage experiences and session lighting state remain available when returning home.

The scene uses an original Canvas renderer with a layered Indian skyline, domed rooftops, fairy lights, terrace diyas, additive particle trails, atmospheric smoke, and temporary environmental illumination. A desktop side collection becomes a bottom collection with a fixed launch dock on phones. English/Hindi names, previews, descriptions, selection highlighting and a selected preview are provided for all fourteen choices.

- **Fuljhadi:** a shortening burning wand with radial golden sparks and smoke.
- **Rocket:** accelerating ascent, fiery exhaust, then a colourful spherical burst.
- **Sound Cracker:** an 0.8-second fuse, ground flash, smoke, and a sharp recorded crack. Screen shake is disabled with reduced motion.
- **Anar:** a growing and fading golden fountain emitting up to 1,900 sparks across its lifetime at full graphics quality.
- **Chakri:** accelerated/decelerated spinning ground jets with an elliptical perspective trail.
- **Sky Lantern:** warm paper shading, an internal flame, upward drift, sway, and shrinking atmospheric depth. Repeated launches coexist.
- **1000-Wala Ladi:** a progressing string of 32 timed visual/audio pops representing a longer traditional cracker string without generating a thousand concurrent sources.
- **Multi-Shot:** six staggered rockets with separate launch thumps and explosions.
- **Aerial Shell:** a mortar thump, delayed ascent, a large spherical crown, inner burst and spatial echoes.
- **Color Fountain:** a swaying spray cycling through six colours.
- **Golden Rain:** a wide canopy of slow falling, lingering golden embers.
- **Whistling Rocket:** a longer ascending whistle and a pink aerial burst.
- **Butterfly:** diverging green and pink spinning trails following a fluttering path.
- **Grand Finale:** a 26-second timed sequence of lanterns, fountains, whistles, multi-shot rockets, rain, shells and synchronized bursts. The Diwali greeting appears at 26 seconds while the last embers fade.

Tap the sky for aerial fireworks or the designated terrace for ground fireworks. Drag the crosshair before launching, or use its arrow-key controls. Launch Multiple, Release Lanterns, Grand Finale, Pause/Resume and Stop All work without reloading. The finale cannot be started twice concurrently. Stop All cancels queued acts and active audio.

### Sound implementation and rights

Three **real CC0 recordings** are bundled under `public/audio`: Ned Bouhalassa’s sparkler, Rudmer_Rotteveel’s whistling rocket/explosion, and Joseph SARDIN’s outdoor firecracker. The sparkler is a trimmed mono PCM excerpt. Recorded rocket ascent and explosion segments are separated at the waveform transient and triggered by the corresponding simulation phases. Ladi uses short cracker excerpts. See [full audio attribution](public/audio/ATTRIBUTION.md) for original links, licenses and transformations.

Fountain, spinner, wind/flame, colour spray, golden rain, butterfly, fuse, thump and supplemental whistle layers are **original Web Audio approximations**, not recordings of those exact fireworks. Profiles have different noise spectra, modulation rates, crackle densities, envelopes and oscillator sweeps. The selected firework’s sound source is labeled in the UI. A recording load/decode failure is disclosed and uses designed fallback audio.

Audio initializes only on an explicit launch or sound-control interaction. First launch waits for the three small local recordings to decode before starting the simulation. A master slider, mute control, stereo positioning, distance attenuation, compressor, maximum 40 active voices, bounded buffer cache and source disconnection manage the mix and resource lifetime. Background music on the homepage stays independent and opt-in.

### Performance and verification

The playground route and styles are lazy loaded. Graphics begin in low mode on phones, constrained CPUs and Save-Data connections. Low mode uses 1x pixel density, a 30fps target, reduced emissions and a hard budget of 900 active particles (240 with reduced motion, 3,200 at full quality). The engine also lowers emissions after sustained slow frames. It sleeps when idle and pauses the simulation clock while the tab is hidden. Audio is suspended when hidden or manually paused; ongoing sustained sounds resume with the celebration. Scene canvases, scheduled acts, listeners and voices are cleaned up on navigation.

`npm test` includes the homepage regression journey, greeting/encoding checks, each individual firework’s lifecycle and sound events, simultaneous low/reduced-motion budgets, finale timing/cancellation, audio mixing/mute/disposal, local audio-file checks, and a complete playground DOM journey covering selection, ground taps, drag/keyboard placement, launch controls, volume, graphics, finale and back navigation. DOM tests substitute Canvas/audio platform APIs and animation rendering; they do not prove pixel appearance, perceived audio quality or physical iOS/Android performance. Browser/device visual and listening QA remains necessary before public release.

New implementation files live in `src/fireworks/`: centralized `catalog.js`, pure simulation `engine.js`, Web Audio `audio.js`, Canvas `renderer.js`, reusable `FireworkPreview.jsx`, `PlaygroundStage.jsx`, `FireworksPage.jsx` and scoped `fireworks.css`. Routing lives in `src/RouterApp.jsx`.

## Hand-held Rainbow Fuljhadi

Select **Fuljhadi** in `/fireworks` to open its dedicated, lazy-loaded React Three Fiber experience. The existing fireworks engine, the other firework types, the homepage, and their sound paths are preserved. The night scene remains the original playground canvas; its live image becomes the background of the 3D view, so ongoing fireworks can still appear behind the hand.

The original procedural hand has a palm, wrist, articulated curved fingers, thumb, nails and a small thread bracelet. A metallic shaft is held in its grip. The hand, shaft, burn point, light and emitter share one transform relationship; movement steers the hand’s rotation, while the coating shortens toward the intact handle. The hand starts unlit. **Light Fuljhadi** begins a 38-second burn; **Relight Fuljhadi** starts fresh after burnout. **Restart** extinguishes it and resets the position and artwork.

There are three modes: Classic (gold), Rainbow (six colors), and Light Painting. Red, green, blue, yellow, purple, pink and rainbow swatches change new sparks immediately. Existing strokes retain their original colors, allowing multicolored drawings. Selecting an individual non-gold color switches Classic to Light Painting. Rainbow can also be used as the ink in Light Painting.

Hold and drag with a mouse or one finger. Pointer capture and coalesced samples keep movement continuous, with interpolation between actual samples. No circle, spiral, heart, star, name or infinity drawing is prerecorded or automatically generated. Every stroke follows the visitor’s input. Stroke width grows with movement speed. Normal light trails fade after 2.4 seconds; Light Painting strokes fade over 12 seconds. Clear Light Trails leaves the current burn running. Capture Celebration exports the rendered night, hand, sparks and artwork as `deepotsava-fuljhadi-art.png`.

GPU points, line segments and feathered mesh ribbons share preallocated dynamic buffers. Full graphics uses an UnrealBloomPass; low graphics uses additive shader glow at 1x pixel density and a 30fps target. Maximum spark counts are 2,400/full, 1,000/low and 300/reduced motion, with bounded trail and smoke storage. Pointer movement does not set React state. The renderer sleeps after the burn and trails finish, and pauses while the tab is hidden. It cleans up buffers, materials, textures, compositor passes, listeners and audio on unmount. WebGL failures use a clearly labeled Canvas compatibility view with the same live input model and capture controls.

Touch scrolling is prevented only inside the Fuljhadi drawing surface; the page and color strip remain scrollable. Arrow keys and four direction buttons provide a non-drag movement alternative. The playground’s existing volume, mute and pause controls also govern Fuljhadi. Reduced motion suppresses hand steering and reduces automatic spark emission while retaining user-directed painting.

The existing CC0 Ned Bouhalassa sparkler recording loops with softened edges for continuous authentic sizzle/crackles. Small transient excerpts provide occasional stronger pops. The match ignition is an original synthesized approximation, identified in the UI. Sound begins with ignition, follows the burn’s fade and stereo position, and stops at burnout/reset/unmount. It pauses with the visual simulation. If the recording cannot load, the visitor is told that a designed approximation is being used.

`tests/sparkler.test.mjs` checks the 38-second lifecycle, intact grip, individual/rainbow colors, actual sampled circle/spiral/infinity trajectories, fading, speed-dependent widths, budgets, and audio loop/fade/mute/cleanup. `tests/sparkler-interaction.test.mjs` exercises mouse and touch Pointer Events, capture/release, modes, color controls, directional movement, clear, PNG export, pause, burnout, relight and restart using Canvas compatibility rendering and substituted audio APIs. These automated checks do not substitute for visual WebGL, physical phone, or listening QA; browser access was unavailable in the implementation session.
