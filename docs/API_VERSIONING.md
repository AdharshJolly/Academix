# Academix API Versioning and Deprecation Policy

## 1. Current Versioning
Academix API is currently at `v1`, accessible via the `/api/v1/` prefix.

## 2. When to Create a New Version (`v2`, `v3`, etc.)
A new major version of the API should be introduced when a **backwards-incompatible** (breaking) change is required. Examples of breaking changes include:
- Removing an endpoint.
- Changing the response schema (removing a field, renaming a field, or changing the data type of an existing field).
- Making previously optional request parameters mandatory.
- Changing authentication mechanisms.
- Altering pagination structure or standard error formats.

Non-breaking changes (like adding new endpoints, adding optional parameters, or adding new fields to a response schema) should be implemented directly in the current version (`v1`).

## 3. Deprecation Timeline
When a new major version (e.g., `v2`) is introduced, the previous version (`v1`) will enter a deprecation period:
1. **Announcement**: An official announcement will be made in the `CHANGELOG.md` and via developer communication channels. The old endpoints will include a `Deprecation` header (e.g., `Deprecation: @<date>`).
2. **Support Period**: The deprecated version will be fully supported (bug fixes and critical security updates only, no new features) for **6 months** from the release of the new version.
3. **Sunset (End of Life)**: After the 6-month support period, the deprecated API endpoints will be removed from the server, resulting in `404 Not Found` or `410 Gone` errors.

## 4. Changelog
All changes (both breaking and non-breaking) must be documented in a `CHANGELOG.md` file located at the root of the project. The changelog will follow the format of [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 5. Sunset Headers
For any endpoints that are explicitly marked for sunset, the API will respond with:
- `Deprecation: <date-and-time>` (when the feature was marked as deprecated)
- `Sunset: <date-and-time>` (when the feature will become completely unavailable)
- `Link: <url-to-migration-guide>; rel="deprecation"`
