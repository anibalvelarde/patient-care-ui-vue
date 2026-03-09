# Component Reference — Patient Care UI

## Shared Components

### JumpToDate (`components/shared/JumpToDate.vue`)
A reusable date picker dropdown for jumping to a specific month/year/day. Used across all UI options.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `alignRight` | `Boolean` | `false` | Align dropdown to the right edge |
| `buttonClass` | `String` | Blue theme | Tailwind classes for the trigger button |
| `panelClass` | `String` | White theme | Tailwind classes for the dropdown panel |
| `labelClass` | `String` | Gray theme | Tailwind classes for field labels |
| `selectClass` | `String` | White theme | Tailwind classes for select inputs |
| `jumpButtonClass` | `String` | Blue theme | Tailwind classes for the "Go" button |
| `cancelButtonClass` | `String` | Gray theme | Tailwind classes for the "Cancel" button |

| Event | Payload | Description |
|-------|---------|-------------|
| `jump` | `string` (en-US date) | Emitted when user confirms a date selection |

## Per-Option Component Patterns

Each option follows a consistent structure:

### Header Component (`O{N}Header` or `O{N}TopBar`)
- Receives `selectedDate` prop
- Emits `date-selected` event
- Contains: brand logo, date navigation (prev/next/today), JumpToDate, role badge, "Back to Options" link

### Calendar Component (`O{N}Calendar` or `O{N}MiniCalendar`)
- Receives `selectedDate` prop
- Emits `date-selected` event
- Varies by option: week strip, month grid, collapsible panel, or pill tabs

### Appointment Display (`O{N}Appointments`, `O{N}AppointmentTable`, `O{N}AppointmentList`)
- Receives `appointments` prop (type `Appointment[]`)
- Rendering varies: tables, cards, swim lanes, master-detail list

### Footer Component (`O{N}Footer`)
- Static component with copyright and option label

## Component Inventory by Option

| Option | Components |
|--------|-----------|
| 01 — Clean Medical | O1Navbar, O1ActionBar, O1Calendar, O1Appointments, O1AppointmentCard, O1Footer |
| 02 — Dashboard Cards | O2Sidebar, O2Header, O2StatsBar, O2Calendar, O2Appointments, O2Footer |
| 03 — Modern Dark | O3TopBar, O3StatsBar, O3Calendar, O3Appointments, O3Footer |
| 04 — Kanban Board | O4TopBar, O4KanbanBoard, O4Footer |
| 05 — Command Center | O5Header, O5MiniCalendar, O5AppointmentTable, O5StatsStrip, O5AlertStrip |
| 06 — Split Panel | O6Header, O6Calendar, O6AppointmentList, O6DetailPanel |
| 07 — Warm Minimal | O7Header, O7WeekPills, O7AppointmentList, O7AppointmentCard |

## Core Interface

### Appointment (`interfaces/Appointment.ts`)

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
