# Madonna — Lounge & Booking

A private, durable operational demonstration for Madonna Beauty Lounge, Amman. Arabic RTL, green `#023222`, warm cream, and original published brand assets.

## Immersive redesign — September 2026

The customer route now opens as an editorial brand journey in the exact extracted green `#023222` and warm cream `#F5E8D8`. A custom GLB orchid responds to the scroll chapter and reservation step, with directional shadows, physical materials, studio environment lighting, and subtle pointer response. The orchid is an original modeled asset with 49,784 triangles, 15 mesh primitives, five materials, and no external textures or decoder.

Booking opens in a full-screen accessible Radix dialog; the working booking API, catalog, availability rules, and persisted data are preserved. The same sculpture accompanies the reservation stages; confirmation is rendered from the server-returned booking snapshot. Closing and editing are disabled while a save is pending, and focus returns to the invoking button. Inactive narrative controls use `inert` and `aria-hidden`.

The scene caps rendering resolution and frame frequency, skips rendering offscreen or behind the booking dialog, pauses ambient movement for reduced motion, and supplies a rendered fallback when WebGL or asset loading fails. These are implemented budgets and fallbacks, not measured device performance claims. No browser/visual QA has been performed for this revision.

The administrative workspace now uses broad emerald/cream surfaces, a branded masthead, refined timeline styling, and consistent visual treatment across clients, requests, services and reports.

`design-source/` preserves the editable Blender scene, reproducible Python geometry scripts, full-resolution generated editorial concepts and geometry metadata. The web uses compressed WebP copies; the conceptual photographs are not portrayed as actual treatment results. These were generated specifically for this design, with the supplied brand palette.

## Product

- `/`: reception workspace, daily staff timeline, appointment search/status filters, home visits, client visit histories, editable service prices/durations/availability, and reports based on stored bookings.
- `/book`: customer booking experience with service combinations compatible with staff skills, location mode, available time slots, customer details, and a persisted pending request.
- Structured records live in platform D1, scoped to the signed-in Site user. Browser storage is not the record store.
- Atomic SQL prevents overlapping appointments. Home visits reserve 30 minutes for travel on either side. Retries with the same request ID do not duplicate bookings.
- Service price and duration are snapshotted on bookings. Editing the catalog affects future bookings only.
- Transitions: pending → confirmed → arrived → completed, with cancellation/no-show where appropriate.

## Scope and truthfulness

This is an owner-private sales demonstration, not Madonna's production service. Names, prices, durations, team assignments, and sample operational data are explicitly labeled illustrative in the interface. Records really persist. The sample workday is 10:00–20:00, Asia/Amman. The catalog contains 9 sample services; this is not a transcription of the full official price menu.

It does not send WhatsApp, SMS, email, or push messages. It does not collect payments, charge deposits, contact the real salon, or provide public customer/employee accounts. Platform identity protects this private demonstration; separate staff roles and public client authentication must be designed before public operation. Bookings are scoped to the viewing owner's demonstration workspace, not shared across multiple staff users.

Reports show the face value of completed services, not collected cash. The initial application query is bounded to 1,500 recent bookings; production analytics and historical browsing need server pagination and aggregate queries. Staff expertise and travel buffers are demonstration assumptions. No performance or production-security certification is claimed.

Before real operation: approve the official service catalog/prices/durations, staff calendar and leave rules, opening hours, home service area and travel charges, privacy/retention policies, staff roles, and notification/payment providers. Then configure and test those integrations with the salon's authorization.

## Observed opportunity, 2026-09-05

Public homepage inspection found the main WhatsApp booking button using the public phone +962795222719, while a Nail Services booking card used a different number (`962123456789`). No messages were sent. The public experience did not expose a slot picker, service duration, or service prices. This supports a unified structured booking path; it does **not** prove internal scheduling or customer retention deficiencies.

Sources:
- https://www.madonnablc.com/
- https://www.instagram.com/madonna.blc/
- Original logo: https://www.madonnablc.com/lovable-uploads/6e5e0536-af07-41e3-9645-58d8b9d635aa.png
- Brand beauty image: https://www.madonnablc.com/lovable-uploads/2bb5f296-9cc2-43b7-b7a3-e86aa78a2611.png
- Brand study and extracted asset kit supplied in the preceding task. Logo copied without raster editing. Beauty image is existing brand artwork, not represented as a real treatment photograph.
- IBM Plex Arabic and Cormorant Garamond are implementation font choices, not claimed original brand typefaces.

## Validation

`node --test tests/booking-business.test.mjs`

Integration tests execute the actual API handler over a SQLite-backed D1 adapter and generated migration. Covers authorization/origin checks, durable catalog setup, isolated records, idempotency, overlap/adjacency, travel buffers, incompatible combinations, dates, status transitions, service snapshots, and repeatable demo seeding. These are local API/database tests, not a live browser or production deployment test.

Build using the installed Sites build workflow. Source identity is `.openai/hosting.json`; maintain this Site's identity for future edits.


### Reservation layout and scene refinement

The full-screen reservation now resets CSS individual translate/scale/rotate properties as well as transform. Tailwind 4's inherited 50% translation previously moved half of the dialog outside the viewport. The call site also replaces the centered translation utilities and sets individual transforms inline because CSS optimization can fold static individual transforms into the transform shorthand. The dialog uses the dynamic viewport height, visible wrapping service categories, explicit selection states, keyboard focus outlines, and in-bounds sticky navigation. Ordinary administration dialogs retain their centered layout.

The hero now uses one full-bleed WebGL scene with an animated, tessellated satin surface, analytical fold normals, and restrained studio lighting around the retained orchid asset. Responsive camera framing reserves space for the Arabic copy and reduces the previous oversized sculpture. The animation clock pauses offscreen and while booking is open; the existing reduced-motion and artwork fallback paths remain. No production data or appointment logic changed. Validation is source/build-based; no browser QA was performed in this change.

### Five photographic rituals

Each service category now has its own locally served, real photograph, connected through `app/book/rituals.ts`. Source photographs, photographers, exact Pexels URLs, and license notes are retained in `design-source/service-photography/sources.json`. These are representative stock images, not Madonna customer results; the service gallery includes that distinction. The previous two-image category fallback is no longer used for services.

`service-stage.tsx` displays the five photographs on curved meshes within the emerald satin scene. Selection follows the shortest carousel path, supports the category controls and next/previous buttons, and accepts horizontal touch swipes without hijacking vertical scrolling. Mobile categories remain next to the image. The selected photograph remains available as an HTML image when WebGL cannot initialize or loses its context. GPU work starts near the gallery, stops outside it or during booking, and honors reduced motion. The orchid has a stronger scroll-driven change of angle and a sequenced petal opening; the approved green and native scroll remain.

Validation for this revision: TypeScript/build and local asset/selection consistency checks, plus read-only lifecycle review. No browser or visual Site QA was requested or performed. Existing reservation viewport fixes and backend booking logic are preserved.
