# Student Records — Admin Dashboard

A client-side admin dashboard for managing student records, built with vanilla JavaScript (ES modules) and Bootstrap 5. All data is held in-memory from a local mock dataset — there is no backend, build step, or package installation.

## Project Overview

- **What it is:** A single-page admin dashboard for viewing and managing student records.
- **Main purpose:** Let an administrator browse, search, filter, sort, add, edit, view, and delete student records, and export them to CSV.
- **Primary features:** A student table with stats cards, filter/sort/pagination controls, find-by-ID lookup, an add/edit modal form with validation, delete confirmation, CSV export with a progress modal, and toast notifications.
- **Intended users:** Administrators or school staff; also serves as a front-end practice project for a fullstack bootcamp.

## Key Features

- **Student table** — avatar, name, email, section, active status, enrolled date, three exam scores, computed average, and pass/fail result (threshold: 75).
- **Search and filtering** — debounced keyword search (name or email) plus section, remarks (passed / needs improvement), and status (active / inactive) filters, with a reset button.
- **Find Student by ID** — dedicated lookup panel that validates the input and shows a mini result card or error message.
- **Sorting** — sortable columns (name, average, enrolled, ID) with direction toggling and `aria-sort` support.
- **Pagination** — page controls and a rows-per-page selector (5 / 10 / 25 / 50; default 5).
- **Add / edit student** — modal form with client-side validation (name, email, avatar URL, enrolled date, scores 0–100), live avatar preview, and a Save button disabled when nothing changed in edit mode.
- **View and delete** — record detail modal and a delete confirmation modal, with success/error toast notifications.
- **CSV export** — lazy-loaded export module that generates a CSV of all records (`student-records.csv`) with a simulated progress modal driven by a Web Worker (with interval fallback for throttled background tabs).
- **User avatars** — deterministic color tones derived from the name, initials fallback, optional sanitized http(s) image URLs, and lazy loading.
- **Skeleton loading state** for the table on initial render.
- **Responsive/mobile UI** — collapsible navbar, responsive table and filters, touch-friendly input sizing, and modal behavior tuned for on-screen keyboards (no iOS auto-zoom).

## Tech Stack

| Category | Technology |
| --- | --- |
| Language | JavaScript (ES2020+, native ES modules) |
| UI framework | Bootstrap 5.3.3 (CSS + JS bundle, via jsDelivr CDN) |
| Icons | Bootstrap Icons 1.11.3 (CDN) |
| Fonts | Manrope & Public Sans (Google Fonts) |
| Styling | Custom CSS (`css/style.css`) with CSS variables layered over Bootstrap |
| State management | Plain module state (`js/store/studentStore.js`) — no framework |
| Build tool | None — served directly as static files |
| Backend / database | None — in-memory mock data (`js/data/students.js`) |


## Project Structure

```
student-records/
├── index.html              # Single page: markup for dashboard, modals, toasts
├── css/
│   └── style.css           # Custom theme, component styles, responsive/mobile rules
└── js/
    ├── app.js              # Entry point: initializes all features
    ├── config/
    │   └── constants.js    # App-wide constants (pass threshold, page size, etc.)
    ├── data/
    │   └── students.js     # Mock student dataset (in-memory)
    ├── store/
    │   └── studentStore.js # Records + UI state, filtering and sorting logic
    ├── services/
    │   ├── studentService.js  # Pure logic: averages, validation, record helpers
    │   └── exportService.js   # CSV generation, download, export progress modal
    ├── features/
    │   ├── studentTable.js  # Table rendering, stats, sorting, pagination
    │   ├── findStudent.js   # Find-by-ID panel and filter controls
    │   ├── studentForm.js   # Add/edit modal form and validation
    │   └── studentModals.js # View and delete modals
    ├── components/
    │   ├── avatar.js        # Reusable avatar rendering (tones, initials, images)
    │   ├── modals.js        # Modal/tooltip initialization helpers
    │   └── toast.js         # Toast notification helper
    └── utils/
        ├── dom.js           # DOM helpers ($, debounce, input guards)
        └── format.js        # Formatting helpers (dates, initials, escaping)
```

## Prerequisites

- A modern browser (Chrome, Edge, Firefox, or Safari).
- Any static file server that supports ES modules. Examples:
  - **VS Code Live Server** extension, or
  - Node.js (any recent version) with `npx serve .`, or
  - Python with `python -m http.server`

Opening `index.html` directly via `file://` will **not** work — browsers block ES module imports from the file protocol.

## Installation

```bash
git clone https://github.com/CesarF1204/student-records.git
cd student-records
```

That's it — there are no dependencies to install. All libraries load from CDNs.

## Running the Application

Use the VS Code Live Server extension and click "Go Live".

## Environment Variables

This project does not use environment variables. All configuration lives in `js/config/constants.js` (pass threshold, default page size, export duration, admin identity, CSV filename).

## Testing and Validation

There is no automated test framework in this project. To validate manually:

1. Load the page and confirm the table renders after the skeleton state.
2. Search by name/email; apply and reset section/remarks/status filters.
3. Sort each column and toggle direction; change rows per page and paginate.
4. Find a student by a valid ID (e.g. `101`) and by an invalid ID.
5. Add a student, submit invalid values to see validation, then save.
6. Edit a student (verify Save is disabled until a change is made).
7. View and delete a record; confirm toasts appear.
8. Run a CSV export and verify the progress modal completes and the file downloads.

## Architecture and Code Organization

- **Component/feature-based structure** — `js/components` holds reusable UI pieces (avatar, toast, modals); `js/features` holds dashboard features; `js/services` holds pure business logic; `js/store` holds shared state.
- **Centralized state** — a single `state` object in `studentStore.js` drives filters, sorting, pagination, and active dialogs; render functions read from it.
- **Separation of concerns** — pure computation (averages, validation, CSV) lives in services; DOM manipulation lives in features and components.
- **Lazy loading** — the CSV export module is dynamically imported on first use.
- **Reusability and DRY** — shared helpers (`$`, `debounce`, `escapeHtml`, avatar rendering, toast) are used across features instead of duplicated logic.
- **Documented code** — every function carries a JSDoc-style `DOCU:` header (description, last updated date, params, returns, author) per bootcamp convention.

## Development Guidelines

- Document functions with the existing `DOCU:` JSDoc header format and keep the last-updated date current.
- Place reusable UI in `js/components`, feature logic in `js/features`, pure logic in `js/services`, and shared constants in `js/config`.
- Keep the single `state` object in `studentStore.js` as the source of truth for UI state.
- Follow the existing styling approach: Bootstrap utilities plus CSS variables in `style.css`; keep mobile/touch behavior in the dedicated media queries at the end of the file.
- Keep the app responsive when adding UI — test on mobile widths and touch devices.
- Avoid adding build tools or npm dependencies; the project intentionally runs as plain static files.
- Remove unused code and imports when changing features.

## Responsive Design

The layout targets desktop, laptop, tablet, mobile, and small mobile devices:

- Collapsible Bootstrap navbar with a custom two-row mobile layout.
- Responsive stat cards, filter bar, table, modals, and typography across Bootstrap breakpoints.
- Touch-focused behavior: 16px input font size on touch devices (prevents iOS focus auto-zoom), 40px minimum control heights, and modals that anchor to the top and use page-level scrolling so the on-screen keyboard never hides the focused field (`interactive-widget=resizes-content` for Android).

## Build and Deployment

There is no build step or deployment configuration in the project. Deploy by copying the files as-is to any static file host (e.g., GitHub Pages or any web server) — no compilation required.

