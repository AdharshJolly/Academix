# Screen Specifications
## CampusFlow — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

---

## Navigation Map

```
/auth               → Login / Register
/dashboard          → Academic Health Overview
/workspace          → Tasks | Notices | Planner (tabbed)
/calendar           → Calendar view
/automation-center  → Automation logs and triggers
/profile            → User profile
/settings           → User preferences
```

---

## Screen 1: Authentication (`/auth`)

**Purpose:** Allow students to log in or register via Supabase Auth.

**Route:** `/auth`

**Layout:** Centered card, full-screen background

**Component Tree:**
```
AuthPage
└── AuthCard
    ├── LogoHeader
    ├── TabSwitcher (Login | Register)
    ├── LoginForm
    │   ├── EmailInput
    │   ├── PasswordInput
    │   └── SubmitButton
    └── RegisterForm
        ├── FullNameInput
        ├── EmailInput
        ├── PasswordInput
        └── SubmitButton
```

**API Dependencies:**
- Supabase Auth (handled client-side, no backend call)

**States:**
- Loading: Spinner on submit button
- Error: Inline error message below form
- Success: Redirect to `/dashboard`

**Validation:**
- Email: required, valid format
- Password: required, min 8 characters
- Full Name (register): required

**Acceptance Criteria:**
- User can log in with valid credentials
- Invalid credentials show error message
- Successful login redirects to dashboard

---

## Screen 2: Dashboard (`/dashboard`)

**Purpose:** Provide an at-a-glance academic health summary.

**Route:** `/dashboard`

**Layout:** Grid layout with cards

**Component Tree:**
```
DashboardPage
├── DashboardHeader (greeting + date)
├── AcademicHealthCard
│   └── RiskIndicator (low/medium/high)
├── NextRecommendedAction
├── UpcomingDeadlines (list)
├── TodaySchedule
├── CalendarPreview
└── RecentAutomations (list)
```

**API Dependencies:**
- `GET /api/v1/dashboard` → `DashboardResponse`

**States:**
- Loading: Skeleton cards
- Error: Error toast + retry button
- Empty: Friendly empty state with CTA to workspace

**Acceptance Criteria:**
- Dashboard loads in under 2 seconds
- Risk level visually prominent
- Upcoming deadlines sorted by date

---

## Screen 3: Workspace (`/workspace`)

**Purpose:** Central hub for tasks, notices, and planner.

**Route:** `/workspace`

**Layout:** Full-width with tab navigation

**Tabs:** Tasks | Notices | Planner

### Tab: Tasks

**Component Tree:**
```
WorkspacePage
└── TasksTab
    ├── TasksToolbar (search + filter + create button)
    ├── TaskTable
    │   ├── TaskRow (× n)
    │   └── EmptyTasksState
    └── CreateTaskModal
        ├── TitleInput
        ├── DescriptionInput
        ├── DueDatePicker
        ├── PrioritySelect
        └── SubmitButton
```

**API Dependencies:**
- `GET /api/v1/tasks` → `PaginatedResponse[TaskResponse]`
- `POST /api/v1/tasks` → `APIResponse[TaskResponse]`
- `PUT /api/v1/tasks/{id}` → `APIResponse[TaskResponse]`
- `DELETE /api/v1/tasks/{id}` → `APIResponse[null]`

### Tab: Notices

**Component Tree:**
```
WorkspacePage
└── NoticesTab
    ├── NoticeSubmitForm
    │   ├── NoticeTextarea
    │   └── ProcessButton
    ├── ProcessingState (spinner)
    └── IntelligenceResultCard
        ├── ExtractedEvents (list)
        ├── RiskBadge
        ├── Recommendations (list)
        └── AutomateButton
```

**API Dependencies:**
- `POST /api/v1/intelligence/process` → `APIResponse[IntelligenceResponse]`

### Tab: Planner

**Component Tree:**
```
WorkspacePage
└── PlannerTab
    ├── ScheduleCalendar (weekly view)
    └── ScheduleList
        └── ScheduleItem (× n)
```

**API Dependencies:**
- `GET /api/v1/dashboard` (TodaySchedule field)

---

## Screen 4: Calendar (`/calendar`)

**Purpose:** View academic events and Google Calendar sync status.

**Route:** `/calendar`

**Layout:** Full calendar view

**Component Tree:**
```
CalendarPage
├── CalendarHeader (month navigation)
├── CalendarGrid
│   ├── DayCell (× 28-31)
│   │   └── EventDot (× n)
│   └── EventPopover
└── SyncStatusBadge
```

**API Dependencies:**
- `GET /api/v1/dashboard` (CalendarPreview field)

**States:**
- Loading: Skeleton calendar
- Empty: "No events — process a notice to add events"

---

## Screen 5: Automation Center (`/automation-center`)

**Purpose:** View automation history and trigger statuses.

**Route:** `/automation-center`

**Layout:** Log table with filters

**Component Tree:**
```
AutomationCenterPage
├── AutomationToolbar (filter by type/status)
├── AutomationTable
│   ├── AutomationRow (× n)
│   └── EmptyAutomationState
└── TriggerPanel
    ├── ManualTriggerButton (task)
    ├── ManualTriggerButton (notice)
    └── ManualTriggerButton (schedule)
```

**API Dependencies:**
- `GET /api/v1/automations/logs`
- Automation trigger endpoints are internal to task creation and intelligence processing.

---

## Screen 6: Profile (`/profile`)

**Purpose:** View and edit user profile.

**Route:** `/profile`

**Component Tree:**
```
ProfilePage
├── AvatarUpload
├── ProfileForm
│   ├── FullNameInput
│   ├── EmailDisplay (read-only)
│   └── SaveButton
└── AccountActions
    └── LogoutButton
```

**API Dependencies:**
- Supabase Auth (user metadata)

---

## Screen 7: Settings (`/settings`)

**Purpose:** Manage notification and app preferences.

**Route:** `/settings`

**Component Tree:**
```
SettingsPage
├── NotificationSettings
│   ├── WhatsAppToggle
│   ├── CalendarSyncToggle
│   └── ReminderTimingSelect
└── AccountSettings
    └── DeleteAccountButton
```

**API Dependencies:**
- TODO: Settings endpoint (future)

