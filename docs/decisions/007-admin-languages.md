# 007 — Admin pages: English and Mongolian only

**Decision (2026-11-01):** The `/admin` pages have texts in English and Mongolian only (`features/admin/messages.ts`); other site languages show English.

- Only the owner uses them, so translating them into all 10 languages would add a lot of text nobody reads.
- The text is still kept out of the components (no hard-coded strings), so more languages can be added later.
- Everything a normal user can see (blocked message, "temporarily unavailable", the Admin link) is in all 10 languages. The banner text is whatever the owner types, in one language.

## Privacy note
Conversations a user deletes are kept (hidden) so the admin can still read them. Tell users in your privacy policy that conversations are stored and visible to the site owner.
