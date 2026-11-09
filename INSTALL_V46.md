# SULMOS26 Automotive V46 — Technical Body-Style Vehicle Drawings

## Install
Upload/replace exactly these four files in the existing `sulmos26-panel-beaterss` GitHub repository:

- `public/inspection.html`
- `public/inspection.css`
- `public/inspection.js`
- `public/vehicle-outline.js` (new)

Commit to `main`, ensure Panel Beater Check passes, then run the existing Panel Beater deployment workflow. No D1 migrations, secrets or changes to the Retail repository.

## Use
Select a repair job. The vehicle body-style drawing loads immediately, even with no licensed 3D asset. The type is auto-detected from the model name with a manual override: SUV, sedan, hatchback, bakkie, van, wagon, coupe. Choose colour, toggle left/right/front/rear/top view, click an illustrated body panel to fill the damage field, choose severity and action, add the panel, and save the assessment. Downloading the damage report captures the visible outline. Existing matching 3D or company photo-pack modes remain available.

## Accuracy
These are intentionally generic technical vehicle drawings; they never represent a precise Toyota, Ford, VW or other manufacturer's exact model. Body type inference is heuristic and can be overridden. Rotate with view tabs; the drawings are 2D vector illustrations rather than true 3D.
