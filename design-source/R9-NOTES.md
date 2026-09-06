# Madonna Desk — employee application

The approved customer experience is pinned unchanged at tag `madonna-client-approved-r8`
and branch `approved/client-r8`, source `fee1f06d839dfbf69f34d34730ef2402d9712c03`.
Both refs were pushed to the existing Sites source repository. A GitHub copy remains
pending: the connected `danar-capital` account has no Madonna repository and the exposed
GitHub connector cannot create repositories. Do not substitute an unrelated repository.

## Working surface

- `/desk` remains its own installable standalone PWA. Customer navigation, photographs,
  booking presentation, and 3D assets were not edited.
- Daily agenda defaults to cards on mobile; optional employee timeline remains available.
- Mobile bottom navigation: today, new requests, appointments, and more.
- Explicit upcoming/today/full-history filters, chronological request ordering, readable
  touch controls, real last-successful-sync timestamp, and offline mutation blocking.
- Booking detail is derived from current records, so polling updates the open detail.
- Reception can create a booking directly with availability, service compatibility,
  home-travel buffers, validated phone, and the existing atomic reservation endpoint.
- Ambiguous saves keep their exact submitted payload and idempotency key. Polling
  reconciles an already-committed booking and reports its actual date/time. Definitively
  rejected requests unlock the form and get a new key.
- Cancellation/no-show require a local confirmation and release the occupied interval.

## Employee authorization

- Manager: original server-configured administrator; all existing operational controls
  plus employee access management.
- Reception: shared bookings and client histories; create/confirm/manage visits; cannot
  edit service settings, seed samples, or manage employee permissions.
- Specialist: server-filtered assigned bookings only, own visit status actions; cannot
  confirm incoming requests, create bookings, or administer settings.
- Approved email membership binds once to the platform's trusted user ID. Reassignment
  or revocation applies to the next API request; the active application refreshes every
  five seconds while visible and online. Revocation cannot erase data already viewed.
- `/desk`, `/api/workspace`, and `/api/desk/team` all check server-side authorization.
- New `desk_members` table and Drizzle migration. Existing salon data is preserved.
- Customer APIs retain their separate verified-phone gate and minimized availability data.

## Launch boundaries

The Site's owner-private audience has not changed. No staff accounts were invented,
granted, invited, or messaged. Actual employee emails must be explicitly added by the
manager, and those accounts also need the platform's private Site sharing permission.
Adding an application membership alone does not send an invitation or change Site access.

WhatsApp provider setup, approved real salon team/service data, and public customer
launch remain pending from previous revisions. Staff-entered bookings do not verify
phone ownership or send OTP. No push notification or payment collection is claimed.

## Validation

TypeScript, canonical production build, existing booking/identity/PWA regressions,
and six new database-backed employee authorization tests. Tests cover anonymous and
non-member rejection, manager-only grants, role validation, email normalization,
specialist read/write isolation, receptionist booking collisions, foreign booking IDs,
identity binding, revocation/reactivation, role narrowing, and workspace isolation.
No browser, device, or physical frame-rate testing was requested or performed.
