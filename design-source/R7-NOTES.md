# Madonna R7 — living emerald journey and verified contact

## Delivered

- Shared full-viewport emerald light field: analytic folds, moving satin highlights and scroll depth. One low-resolution WebGL2 plane, approximately 30 fps at rest; display-cadence updates during scroll. Hidden-page and booking pauses, reduced-motion support, CSS color fallback.
- Original monogram preserved as an exact traced asset, smaller inside a twisting satin orbit. Warm ivory/champagne materials and grazing studio light. Ambient foreground motion capped at 60 fps; scroll/pointer transitions follow display cadence and adaptive resolution. No new synthetic salon photographs.
- Every desktop category has distinct image-preview and direct-booking controls. The 48px arrow opens that category at booking step one. Mobile keeps explicit category tabs and the selected-category booking CTA.
- Contact step contains name and WhatsApp number. A home visit retains its necessary address. Optional notes and demo-consent checkbox removed; demo status remains visible.
- Server profile keyed by salon and authenticated Site visitor; unique canonical E.164 phone per salon. Multiple bookings per customer remain valid. Arabic/Persian digits and supported Jordan local formats normalize to the same identity.
- WhatsApp verification adapter, durable expiring challenges, five code attempts, atomic send admission with sliding windows, serialized send/check, one-use approval, and server-side booking verification. A verified number is restored for the same signed-in identity without another OTP. Changing it leaves the old contact intact until the new number is approved; an existing other profile's number is rejected.
- Booking and saved-name changes share one database transaction. Administration and the separate `/desk` PWA retain their existing access checks and booking synchronization.

## WhatsApp activation — required before real sending

There is no configured WhatsApp provider on this Site. Production fails closed: it does not invent a code, claim a message was sent, or create an unverified customer booking.

This implementation uses Twilio Verify with a six-digit WhatsApp code. Configure the salon's approved WhatsApp sender and connect its Messaging Service to the Verify service. Keep OTP validity at the default ten minutes. Add server-only secrets through Site environment configuration:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Never put secrets in the repository or browser. Redeploy the saved version after environment configuration, then validate an explicitly authorized test recipient. Credential presence is configuration readiness, not proof of delivery or sender approval.

Official setup and API references:

- https://www.twilio.com/docs/verify/whatsapp
- https://www.twilio.com/docs/verify/whatsapp/byo
- https://www.twilio.com/docs/verify/api/verification-check
- https://www.twilio.com/docs/verify/api/rate-limits-and-timeouts

## Identity boundary

The Site remains a private Sites application. It continues using platform-verified visitor headers; this contact verification does not introduce public phone sign-in or alter the Site audience. Returning identity is stored server-side, never trusted from a browser flag or typed phone. A future public customer launch needs an explicit audience/authentication decision.

## Validation and limits

Behavioral tests use SQLite transactions and a strictly local simulated provider. They cover normalization, missing credentials, ownership, incorrect/expired/exhausted codes, replay, atomic duplicate prevention, remembered identity, phone changes, throttling and concurrent resend/check. Existing booking/admin/PWA tests remain in place.

No live WhatsApp message was sent. No browser visual QA or physical-phone refresh-rate measurement was performed in this turn. The existing five gallery photos remain labelled representative photography until Madonna supplies its own originals.
