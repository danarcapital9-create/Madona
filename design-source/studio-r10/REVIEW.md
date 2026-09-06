# Madonna — Studio R10 review

This revision develops the approved emerald and cream customer experience. The published R9 and the employee PWA remain the release baseline until review is complete.

## Visible changes

- Rebuilt the opening composition around the original Madonna contour. Blender 4.5.13 LTS supplies a satin ivory face, pearl bevel, and emerald depth; three imported materials are preserved.
- GSAP ScrollTrigger coordinates the sculpture, orbital guide, wordmark, and progress. The approved second headline now has its own readable chapter instead of fading both headlines at once.
- Compositor light layers replace the full-screen WebGL background. The service gallery uses photograph planes with perspective and cancellable GSAP transitions, removing a second real-time WebGL scene.
- All five categories select their corresponding photograph and booking category. Image decoding precedes the transition; photo booking is disabled during the handover to prevent booking the previous category.
- Single-column portrait tablet layout, clear phone hierarchy, full-width category targets, and a native-scroll layout for short screens.
- Booking close/back targets are at least 44 px; the seven-day row fits the 390 px layout; validation messages reveal themselves inside the active scroller.

## Evidence and checks

The initial R9 screenshots were captured before source edits. Final layout checks used an iframe viewport harness in the authenticated browser tool, with the real app and its actual CSS media queries. These are responsive viewport tests, not claims of physical iPhone/iPad testing. The host browser has a 15 px scrollbar, so the document content widths are recorded separately.

| Frame | Document width / scroll width | Hero height | Booking CTA bottom | Result |
|---|---|---|---|---|
| 390 × 844 | 375 / 375 | 844 | 794 | Fits; no horizontal overflow |
| 430 × 932 | 415 / 415 | 932 | 882 | Fits; no horizontal overflow |
| 768 × 1024 | 753 / 753 | 1024 | 957 | Fits; no horizontal overflow |
| 820 × 1180 | 805 / 805 | 1180 | 1113 | Fits; no horizontal overflow |
| 1024 × 600 | 1009 / 1009 | 712 | 662 | Native scrolling, no sticky clipping |
| 1440 × 900 | 1425 / 1425 | 900 | 786 | Fits; no horizontal overflow |

The phone journey link, category buttons, six consecutive category switches, and matching booking entry were exercised. A carousel translation defect found during QA was fixed; the settled Hair card was subsequently measured at opacity 1 and an identity transform (centered), with the correct hair photograph. `touch-action` is `pan-y pinch-zoom`.

The 390 px screenshot is an exact crop of the captured viewport. Tablet and 1440 px evidence show the browser host frame, which can crop its outer review harness; the actual app dimensions and CTA bounds above were measured inside the frame. No screenshot was generated to stand in for browser evidence.

## Boundaries

- The cloud browser explicitly disables WebGL. The photographed fallback and CSS/GSAP path were checked. Real-time material appearance, GPU frame rate, context recovery, and physical-device thermal behavior still require a WebGL-capable device. No 60/90/120 fps claim is made.
- The preview was repeatedly displaced by other active projects; captured results were accepted only while the DOM identified Madonna. This also interrupted longer continuous session testing.
- Anonymous local preview reaches the existing authentication gate. The customer booking portal and category handoff were checked to that gate; an authenticated full booking and live WhatsApp send were not performed.
- The 45 existing automated checks cover business rules, normalized unique phones, OTP lifecycle, return-customer identity, permissions, PWA isolation, SSR, and the real GLB camera bounds. WhatsApp provider credentials remain unconfigured and fail closed.
- Existing representative service photographs and their disclosure are preserved. They are not presented as verified photographs from Madonna’s social media.
- Production build and regression results are recorded in the handoff. The temporary viewport harness is excluded from source and final build.

## Asset budgets

GLB: 245,168 bytes; 10,604 triangles; six original holes; zero nonmanifold or boundary edges after Blender reimport. The contour comparison IoU is 0.999920. Transparent fallback: 1400² WebP, 397,580 bytes. The editable .blend and reproducible source are included.
