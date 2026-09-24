# RefitFlow prototype

## Purpose
Single-page React prototype for yacht refit management. Keep the demo runnable without a backend and keep domain data in explicit local state so it can later be replaced by API calls.

## Conventions
- Use functional React components and hooks.
- Prefer small presentational components and data-driven views over duplicated markup.
- Keep the maritime-professional visual system in `src/styles.css`.
- Keep production integration seams marked with concise comments.

## Verification
- Open `index.html` in a browser or serve the folder with any static web server.
- Verify fleet switching, workspace tabs, work-list filters, contract lock state, change-order approval, Gantt view toggle, and print preview.
