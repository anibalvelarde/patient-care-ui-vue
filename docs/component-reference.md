# Component Reference — Patient Care UI

> **Note:** prior to WP-16C (2026-05-04) this app hosted a 7-option design-comparison framework. All but one option was deleted. The current production layout components live in `src/components/option02/`. The `option02` name is a historical artifact — WP-17C will rename it.

## Layout components (`components/option02/`)

Used by every production view. Composed in this shape:

```
<O2MobileNav />           — narrow-screen drawer nav
<div class="flex flex-1">
  <O2Sidebar />           — wide-screen left rail
  <div class="flex-1 flex flex-col">
    <O2Header />          — page top bar
    <main>{{ view body }}</main>
    <O2Footer />          — copyright + UiVersion + ApiHealthStatus
  </div>
</div>
```

| Component | Purpose |
|---|---|
| `O2Header.vue` | Page title bar with navigation breadcrumbs |
| `O2Sidebar.vue` | Persistent left-rail nav (medium+ screens) |
| `O2MobileNav.vue` | Hamburger-driven drawer nav (small screens) |
| `O2Footer.vue` | Footer; renders `<UiVersion />` and `<ApiHealthStatus />` |
| `O2StatsBar.vue` | Dashboard-only KPI strip |
| `O2Calendar.vue` | Dashboard-only mini-calendar with `JumpToDate` |
| `O2Appointments.vue` | Dashboard-only daily appointments panel |

## Shared components (`components/shared/`)

| Component | Purpose |
|---|---|
| `JumpToDate.vue` | Reusable date-picker dropdown used by `O2Calendar` |
| `ApiHealthStatus.vue` | Polls `GET /api/health/checks`, renders `API {version} \| {status} \| As of …` |
| `UiVersion.vue` | Renders the build-time-injected UI version (`UI v{n}` footer mode; `UI v{n} ({sha})` full mode) |

### JumpToDate

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `alignRight` | `boolean` | `false` | Align dropdown to the right edge |
| `buttonClass` | `string` | Blue theme | Tailwind classes for the trigger button |
| `panelClass` | `string` | White theme | Tailwind classes for the dropdown panel |
| `labelClass` | `string` | Gray theme | Tailwind classes for field labels |
| `selectClass` | `string` | White theme | Tailwind classes for select inputs |
| `jumpButtonClass` | `string` | Blue theme | Tailwind classes for the "Go" button |
| `cancelButtonClass` | `string` | Gray theme | Tailwind classes for the "Cancel" button |

| Event | Payload | Description |
|-------|---------|-------------|
| `jump` | `string` (en-US date) | Emitted when user confirms a date selection |

### UiVersion

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'footer' \| 'full'` | `'footer'` | `footer` → `UI v{n}`; `full` → `UI v{n} ({sha})` |
| `textClass` | `string` | `text-gray-400` | Tailwind classes for the text span |

## Domain component directories

Each domain has its own dir with form modals, list components, and any domain-specific widgets.

| Dir | Highlights |
|---|---|
| `components/admin/` | `AdminAccordionNav`, `LookupTableManager`, `LookupFormModal`, `AboutPanel` |
| `components/appointments/` | `AppointmentsList`, `AppointmentsTable`, `BookingFormModal`, `ActionsPanel`, `TherapistReassignModal`, `StatusBadge` |
| `components/patients/` | `PatientFormModal` |
| `components/therapists/` | `TherapistFormModal` |
| `components/caretakers/` | `CaretakerFormModal` |
| `components/payments/` | `PaymentFormModal`, `SessionPaymentsModal` |
| `components/statements/` | `TherapistStatementControls`, `TherapistStatementScreen`, plus the older `CaretakerStatement*` siblings |
| `components/sites/` | `SiteList`, `SiteFormModal` |
| `components/treatment-plans/` | `TreatmentPlanList`, `TreatmentPlanFormModal`, `SchedulePlanWizard` |
| `components/schedule/` | Schedule-matrix-specific subcomponents |

## Core data interface

### `Appointment` (`interfaces/Appointment.ts`)

| Property | Type | Description |
|----------|------|-------------|
| `sessionId` | `number` | Unique session identifier |
| `sessionDate` | `string` | Date of the session |
| `patient` | `string` | Patient full name |
| `therapist` | `string` | Therapist full name |
| `therapyTypes` | `string` | Therapy type description |
| `amount` | `number` | Total session amount |
| `discount` | `number` | Discount applied |
| `amountPaid` | `number` | Amount paid so far |
| `amountDue` | `number` | Remaining balance |
| `isPastDue` | `boolean` | Whether payment is past due |
| `isPaidOff` | `boolean` | Whether fully paid |
| `notes` | `string` | Session notes |
| `patientId` | `number` | Patient ID |
| `therapistId` | `number` | Therapist ID |
| `time` | `string` | Session time |

Per-domain interfaces live alongside in `interfaces/` (`Patient.ts`, `Therapist.ts`, `Caretaker.ts`, `TreatmentPlan.ts`, etc.).
