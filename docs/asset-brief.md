# Playbook — Art Asset Brief (for Codex / image generation)

Generate the images below and save them into the `assets-import/` folder at the repo root.
They become the reusable art library that every game pulls from.

## Style (apply to EVERY image, identical wording)
Flat vector illustration, clean shapes, soft cel shading, muted teal and warm amber palette,
subtle paper texture, storybook game art. No text, no letters, no logos, no watermark.
Consistent lighting and line weight across all images so they look like one game.

## Format
- PNG, JPEG or WebP.
- Scenes: 16:9 landscape (e.g. 1600×900). Must contain several distinct, clickable-looking objects
  (desks, cabinets, shelves, machines, doors) spread across the frame — games place clickable hotspots on them.
- Portraits: 1:1 square (e.g. 1024×1024), character shoulders-up, plain soft background, neutral expression.
- Bosses: 1:1 square, a stylized creature/monster themed to the subject, not scary or gory (ages 13–18).

## File naming (required — the prefix tells the importer what kind of asset it is)
`<kind>-<short-description>.png` where kind is one of: `scene`, `portrait`, `prop`, `card`, `boss`.
Example: `scene-chemistry-lab-night.png`, `portrait-pharmacist-middle-aged-woman.png`.

## Image list

### Scenes (20)
scene-chemistry-lab-night, scene-old-library-tall-shelves, scene-spaceship-bridge, scene-hospital-exam-room,
scene-museum-gallery, scene-1914-war-office-maps, scene-greenhouse, scene-detective-office, scene-courtroom,
scene-factory-floor, scene-antarctic-research-station, scene-ancient-roman-forum, scene-biology-lab-microscopes,
scene-train-station, scene-bank-vault, scene-observatory, scene-restaurant-kitchen, scene-art-studio,
scene-ship-cabin, scene-botanical-garden

### Portraits (30) — mix of genders and ethnicities
portrait-pharmacist-middle-aged, portrait-chef-young, portrait-gardener-elderly, portrait-scientist-middle-aged,
portrait-scientist-young, portrait-doctor-middle-aged, portrait-nurse-young, portrait-security-guard,
portrait-engineer-young, portrait-historian-elderly, portrait-librarian-middle-aged, portrait-museum-curator,
portrait-ship-captain, portrait-student-teen-a, portrait-student-teen-b, portrait-teacher-middle-aged,
portrait-detective-middle-aged, portrait-coroner-elderly, portrait-farmer-middle-aged, portrait-journalist-young,
portrait-banker-middle-aged, portrait-coach-athletic, portrait-mechanic-young, portrait-lab-technician-young,
portrait-mayor-elderly, portrait-astronaut-young, portrait-archaeologist-middle-aged, portrait-janitor-elderly,
portrait-artist-young, portrait-soldier-1914

### Bosses (6)
boss-cell-biology-mitochondria-golem, boss-chemistry-bubbling-flask-beast, boss-physics-gear-titan,
boss-history-ink-scroll-dragon, boss-math-geometric-sphinx, boss-literature-quill-phantom
