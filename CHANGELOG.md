# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Integration tests against local Supabase via GitHub Actions CI pipeline.
- Rate limiting implemented on `/auth/register`, `/auth/login`, and `/tasks` endpoints to prevent abuse.
- Token refresh endpoint `/auth/refresh` allowing continuous session usage without forced 72-hour logouts.
- Silent token refresh handling in frontend `apiClient` (`services/api.ts`) and `AuthContext`.
- API Versioning Policy documented in `docs/API_VERSIONING.md`.

## [1.2.0] - 2026-06-28
### Added
- Attendance analytics Phase C features (Streak calculation, Predictive target insights).
- Soft-deletion support for tasks using `deleted_at`.
- End-to-end task operations with Google Calendar syncing.
- Postgres triggers for auto-logging attendance records and real-time views.

### Changed
- Refactored legacy code to use the Repository pattern.
- Separated RLS logic into `ScopedTable` utilities.
- Switched frontend storage strategy to PWA-compatible offline sync with `next-pwa`.

### Fixed
- Fixed user deletion cascades.
- Addressed various edge cases in timeline prediction algorithms.
