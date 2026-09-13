# Project Architecture and Design Rules

## 1. Grid Layout Sizing (STRICTLY LOCKED)
**NEVER modify the height, padding, sizing variables, or grid unit calculations for the Small, Medium, or Large Grid Layout modes.** 

These have been painstakingly mathematically tuned by the user to ensure that apps shrink-wrap perfectly inside frosted container widgets across all responsive breakpoints and layout scales.

Specific files and logic that MUST remain untouched:
- `getCellHeight()` and `getColumns()` logic inside `src/App.tsx`.
- The padding multiplier variables in `updateMinSize` (e.g. `let extra = layoutSize === 'small' ? 4 : layoutSize === 'large' ? 3 : 4;`).
- Container height initialization (e.g. `h: 8 + (layoutSize === 'small' ? 4 : layoutSize === 'large' ? 3 : 4)`).
- The CSS variable classes in `src/App.tsx` handling container and app spacing: `paddingClass`, `textMarginClass`, `titleStyle`, `iconWrapperClass`, `containerPt`, `containerPb`.
- The flex layout applied to the subgrids: `<div class="grid-stack flex-1 mt-1 px-0 overflow-visible w-full"></div>`.

If you are asked to make styling changes to the UI, do NOT touch these specific sizing functions unless explicitly overridden by the user.

## 2. General Architecture
- **Tech Stack**: React (Vite) + Tailwind CSS + Node.js (Express backend).
- **Core Library**: GridStack.js for all dashboard drag-and-drop mechanics.
