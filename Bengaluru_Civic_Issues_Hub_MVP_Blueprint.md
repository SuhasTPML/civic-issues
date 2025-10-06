# 🌆 Bengaluru Civic Issues Hub — MVP Blueprint

## 🎯 Project Goal

Create a public civic platform where Bengaluru residents can report local issues (roads, water, waste, public safety, etc.) with photos and locations.
All verified issues appear on a public interactive map and searchable content hub, enabling editorial follow-up and citizen accountability.

## 🧭 Core Objectives

- Enable citizen participation in civic problem reporting.
- Build a structured civic data repository for journalism.
- Create recurring editorial touchpoints with local authorities.
- Drive trust, loyalty, and SEO via sustained civic coverage.

## 🧩 MVP Scope

| Layer | Feature | Status in MVP | Notes |
|-------|---------|---------------|-------|
| Submission | User-generated civic tickets | ✅ | Core feature |
| Submission | Geo-tagged images + description | ✅ | Manual or auto location |
| Submission | SSO at final submission | ✅ | Required for validation + notifications |
| Submission | Chatbot | ❌ | Phase 2 |
| Editorial Dashboard | Review + approve issues | ✅ | Airtable/Firebase dashboard |
| Public Display | Map view (approved issues clickable) | ✅ | Leaflet or Mapbox embed |
| Public Display | Searchable / filterable list view | ✅ | Filter by ward, category, date |
| Editorial Integration | Tag issues in follow-up articles | ✅ | "Referenced in DH article" auto-appears |
| User Notifications | Email when referenced | ⚙️ Later | Phase 2 feature |
| Analytics Dashboard | Heatmap, top wards, categories | ⚙️ Later | Phase 3 |

## ⚙️ User Flow

### 🧍‍♂️ Step 1: Report an Issue (Pre-login)

- Form embedded on DH site `/bengaluru/civic-issues-hub`
- Fields:
  - Category (Roads / Water / Waste / Power / Public Health / Others)
  - Title (≤100 chars)
  - Description (≤250 chars)
  - Location (auto or manual)
  - Image upload (1 photo)
  - Consent checkbox ("I agree this info may be published by Deccan Herald")
- User clicks "Continue" → draft is created client-side.

### 🔐 Step 2: Login via SSO (Mandatory for Submission)

- Soft-gate screen: shows preview card + "Sign in to submit."
- One-click SSO via DH/PV account (email OTP, Google, Apple).
- On login, system attaches user_id to the draft → converts to official Submission.

### ✅ Step 3: Confirmation & Email

- User reviews final form → clicks "Submit Issue."
- Receives confirmation email with ticket ID and "Track your issue" link.
- Status defaults to New.

### 🏢 Step 4: Editorial Review

- Dashboard view (Airtable or internal CMS panel):
  - Columns: ID, Category, Ward, Description, Photo, Status, Editor Notes, Article Link
  - Actions: Verify / Reject / Publish
- Workflow:
  - New → Verified → Published → (optional) Resolved
- Once published, appears on public map + hub

### 🌐 Step 5: Public Display

Hub Page Layout:
- Map View: Pins for each approved issue; click → issue card (image + short text).
- List View: Filter/search by area, category, or status.
- CTA: "Submit your issue" button pinned on top.
- Auto-tags: "Referenced in this article" when linked to a DH story.

## 🧱 Data Model (Simplified)

| Field | Type | Notes |
|-------|------|-------|
| submission_id | String | Auto-generated |
| user_id | String | Linked via SSO |
| category | Enum | Roads, Water, etc. |
| title | Text | Short headline |
| description | Text | 250 chars |
| lat / lng / ward | Float / String | Geo location |
| photo_url | String | Auto-compressed |
| status | Enum | New / Verified / Published / Resolved |
| editor_notes | Text | Internal only |
| related_articles[] | Array | URLs |
| timestamps | Date | created_at, verified_at, published_at |

## 🔔 Notifications (Phase 2)

- Email on submission ("We received your issue")
- Email when referenced in a DH article ("Your issue has been featured in Deccan Herald")
- Optional: monthly digest of top resolved issues

## 🔐 SSO Logic & Safeguards

- Use existing DH/PV login infrastructure (same user ID).
- SSO triggers at final submission only → avoids early friction.
- Drafts saved locally or in temp DB (expire after 7 days).
- Benefits shown clearly: "Track your issue • Get updates • Edit later."
- Magic-link fallback for partially completed reports.

## 🧑‍💻 Tech Stack (MVP)

| Function | Tool | Reason |
|----------|------|--------|
| Form | Custom webform in Bold CMS | Brand control |
| Drafts | LocalStorage / temp API | Lightweight |
| Auth | Existing SSO (DH/PV) | Single identity layer |
| Database | Airtable / Firebase | Fast setup |
| Map | Leaflet or Mapbox | Free/low-cost |
| Image storage | S3/GCS bucket | Compression + blur support |
| Notifications | Mailchimp or Zapier | Low-effort automation |

## 🗞️ Editorial Integration

- Each issue assigned to an "Area Editor".
- Articles can reference civic tickets by ID (linked automatically on hub).
- Monthly or quarterly "Civic Pulse Report" articles summarizing:
  - Most reported categories
  - Areas with highest unresolved count
  - Official responses / progress

## 📊 KPIs & Success Metrics

| Metric | Target (first 3 months) |
|--------|--------------------------|
| Issues submitted | 500+ |
| Verified issues | 60–70% |
| Published issues | 200+ |
| User accounts created via hub | 300+ |
| Average time to publish | <48 hours |
| Editorial follow-up stories | 10+ |

## ⚠️ Risks & Mitigation

| Category | Risk | Mitigation |
|----------|------|-------------|
| Legal | Defamation / false claims | Pre-publication moderation; redact names |
| Privacy (faces, plates) | Auto-blur + editorial check | |
| Technical | Spam / NSFW uploads | CAPTCHA + AI filter |
| Geo errors | Reverse geocoding validation | |
| Editorial | Overload / delays | Assign Civic Editor + interns |
| Reputation | Misinformation / stale issues | Timestamp + update statuses |
| Engagement | Drop-off at SSO | Soft preview screen + one-tap login |

## 🧠 Editorial + Design Notes

- Visual identity: orange-grey civic palette, Bengaluru skyline icon.
- Use Playfair / Roboto Slab font pairing for continuity.
- Add a "verified by DH" badge for published issues.
- Show transparency counters:
  "Total submitted: 832 | Published: 214 | Resolved: 76."

## 🚀 MVP Rollout Plan

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| Week 1–2 | Ideation & UX mockups | Form + Map design, Airtable setup |
| Week 3–4 | Tech integration | SSO + form + dashboard |
| Week 5 | Pilot launch | 25 live reports (by staff/testers) |
| Week 6–8 | Public go-live | Hub + press release + social campaign |
| Post-launch | Monitor & iterate | Add email notifications + analytics |

## 🌱 Future Phases

| Phase | Feature | Value |
|-------|---------|-------|
| 2 | Chatbot submission (WhatsApp/web) | Easier UX |
| 2 | User email/SMS updates | Retention |
| 3 | Civic analytics dashboard | Data journalism |
| 3 | City expansion (Mysuru, Hubballi) | Scalability |
| 4 | "Civic Pain Index" annual report | Brand thought-leadership |

## 🧾 Summary

The "Bengaluru Civic Issues Hub" is a scalable, high-impact citizen-journalism product — built lean on top of DH's SSO ecosystem and CMS.
It combines public participation, structured civic data, and editorial accountability — delivering both community trust and sustained traffic growth.