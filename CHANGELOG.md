# Changelog

All notable changes to the Family Tree API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-04

### Added
- 🌳 Trees CRUD with share codes (8-char base62)
- 👥 Persons & relationships (parent/child/spouse/sibling)
- 🔑 Auth: register (with optional name), login, forgot/reset password (email)
- 👤 Profile API: update name/email, change password, avatar upload
- 📸 Photo upload (10 MB limit, multer) for persons and avatars
- 🎯 Admin-only dashboard API at `/dashboard/api/*`:
  - Stats: overview, paginated users, daily registrations/trees
  - Admins: create/update/delete admins, change passwords
  - Analytics: total views, daily views, top pages, unique visitors
  - Feedback: list (filter by status), update priority/status, delete
- 👁️ Public `POST /track` endpoint for page-view tracking
- 💬 Public `POST /feedback` endpoint — saves to DB + emails ahmed@bermawy.tech
- 🔒 Role-based access (USER/ADMIN) with AdminGuard
- 🗄️ Separate staging and production databases

### Changed
- `role` column on User (default USER)
- UserProfile created automatically at registration when name provided
- JWT payload includes `name` and `avatarUrl` from profile

### Fixed
- Email credentials moved from hardcoded to `.env`
- Uploaded files removed from git tracking (`uploads/` gitignored)
