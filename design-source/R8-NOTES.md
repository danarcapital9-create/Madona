# Madonna R8 — booking atelier

Only the customer booking dialog was redesigned.

- Replaced the compact 3D monogram with the five existing service photographs. Category tabs and service selection update the photograph; the previous image stays visible until the requested image has decoded. These remain labelled representative photographs, not claimed to be Madonna's own work.
- Added emerald moving silk inside the dialog, reusing the existing low-resolution background renderer. The website's background is paused while booking is open. A booking-header motion control also pauses the subtle photo drift, and reduced-motion preferences are respected.
- Introduced dark emerald surfaces, cream selected services, clearer type, compact category navigation, and coordinated date/contact/OTP/success states.
- Moved desktop continuation into the existing separate action dock, outside scrolling content. All former sticky step footers are hidden, preventing the footer from covering service rows. Mobile retains its single scrolling body and fixed action area.
- Mobile photography is a compact band on steps one and two; the contact form retains its space and usable input sizes. Desktop photos and the receipt occupy separate areas.

Booking logic, identity verification, APIs, administration, and the customer homepage were not changed. WhatsApp provider activation remains pending from R7. No browser QA or physical-phone frame-rate measurement was performed for this visual-only update.
