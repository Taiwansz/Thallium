# Design System: Thallium Core Ledger

## 1. Visual Theme & Atmosphere
Thallium is a high-integrity financial application. The visual theme is defined by clinical precision, high contrast, and structural solid geometry. The layout utilizes a balanced density structure suitable for telemetry, transactions, and audit logs. The mood is dark-mode focused, reminiscent of modern cryptographic dashboards.

- **Density:** Balanced Daily App (5/10)
- **Variance:** Offset Asymmetric Layouts (6/10)
- **Motion:** Responsive Spring Physics (6/10)

---

## 2. Color Palette & Roles
The color system strictly avoids pure black (#000000) and oversaturated neon/purple glows. The color depth uses consistent Zinc-based neutrals with a single emerald-green accent representing transactional security.

- **Canvas Background:** Zinc-950 (#09090b) — Main application backdrop
- **Surface Fill:** Zinc-900 (#18181b) — Card backgrounds, ledger containers, modal boxes
- **Ink Primary:** Zinc-50 (#fafafa) — Headlines, active balances, primary navigation
- **Ink Secondary:** Zinc-400 (#a1a1aa) — Subtext, table column headers, audit timestamps
- **Structural Border:** Zinc-800 (#27272a) — 1px divider lines, card borders, inactive inputs
- **Transaction Accent:** Emerald-500 (#10b981) — Success states, positive ledger entries, active navigation indicators, primary CTA buttons (Saturation < 80%)
- **System Error:** Rose-600 (#e11d48) — Failed transactions, system alerts, negative balance indicators

---

## 3. Typography Rules
To maintain a professional software dashboard aesthetic, all serif typefaces are banned. The typographic system pairs clean geometric sans-serif for reading with tabular monospace for numbers.

- **Display & Headlines:** Geist Sans or Satoshi — Tight tracking (-0.02em), medium to bold weights, controlled size scales
- **Body & Controls:** Geist Sans or Satoshi — Leading relaxed, max-width of 65 characters for text blocks
- **Tabular & Monospace:** Geist Mono or JetBrains Mono — Mandatory for all numerical entries, balances, currency indicators, transaction IDs, and dates to ensure column grid alignment
- **Banned Typefaces:** Inter, Helvetica, Times New Roman, Georgia, and generic browser sans-serif fallbacks

---

## 4. Component Stylings

### Buttons
- **Primary:** Emerald-500 background, black text. Flat shape with 0.375rem rounding. No shadow glows.
- **Secondary:** Outline variant with Zinc-800 border, Zinc-50 text, and background transparent.
- **Feedback:** Tactile active state translates -1px vertically with immediate spring release.

### Cards & Panels
- **Shape:** Rounded corners (0.5rem or 8px). Flat solid surfaces.
- **Elevation:** No heavy drop-shadows. Borders (1px Zinc-800) separate content panels. High-density list areas use border-top dividers instead of nested cards.

### Forms & Input Fields
- **Layout:** Field labels sit strictly above the input. Error messages render inline below the input in Rose-600.
- **Focus State:** Active inputs replace the Zinc-800 border with an Emerald-500 outline. No floating labels.

### Loaders & Empty States
- **Loaders:** CSS skeleton shimmers matching the exact structural layout of the card or ledger line. Spinners are banned.
- **Empty States:** Clean, centered text with secondary muted color and primary action CTA.

---

## 5. Layout Principles
- **Grid Architecture:** All structures must align with CSS Grid. Flexbox is reserved for minor horizontal alignment.
- **Whitespace Containment:** The main viewport max-width is constrained to 1400px. Standard section padding utilizes clamp-based spacing: `padding: clamp(1rem, 4vw, 3rem)`.
- **Viewport Constraints:** Full-height layouts utilize `min-h-[100dvh]` to avoid mobile Safari rendering jumpiness.
- **Mobile Collapse:** All columns collapse to a single column beneath 768px. Horizontal overflow or scrolling on the page is considered a layout failure.

---

## 6. Motion & Interaction
- **Spring Physics:** Interactive transitions use physical models: `stiffness: 100, damping: 20` for weighty, natural acceleration.
- **Waterfall Cascades:** Lists, ledger entries, and card grids render using staggered mounting delays (30ms increments) for a fluid loading animation.
- **Hardware Acceleration:** Animations are restricted to `transform` and `opacity` to maintain 60 FPS rendering.

---

## 7. Anti-Patterns (Banned)
- No emojis inside labels, headers, or buttons
- No Inter font or generic serif typefaces
- No pure black (#000000) for UI backgrounds
- No purple, blue, or neon shadow glows
- No generic template placeholder names (e.g., use real test names instead of "John Doe")
- No fake round numbers (e.g., use real ledger decimal formatting)
- No AI copywriting clichés ("seamless", "elevate", "unleash", "next-gen")
- No overlapping or absolutely-positioned stacked elements
