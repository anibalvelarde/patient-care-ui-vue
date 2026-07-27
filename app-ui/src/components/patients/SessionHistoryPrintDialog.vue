<template>
  <teleport to="body">
    <!-- Date-range dialog (ruling G4). Never printed itself. -->
    <div
      v-if="visible && patient"
      class="fixed inset-0 z-50 flex items-center justify-center print:hidden"
      data-testid="shp-print-dialog"
    >
      <div class="absolute inset-0 bg-slate-900/40" @click="$emit('close')"></div>
      <div
        class="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-xl border border-slate-200 p-5"
        role="dialog"
        aria-label="Print session history"
      >
        <h3 class="text-sm font-semibold text-slate-800">Print / Save as PDF</h3>
        <p class="mt-0.5 text-xs text-slate-500">
          {{ patient.patientName }} · <span class="font-mono">{{ patient.medicalRecordNumber || '—' }}</span>
        </p>

        <!-- Defaulted to the patient's actual first–last session span and clamped to it —
             dates outside the span can't be picked (ruling G4). -->
        <div class="mt-4 grid grid-cols-2 gap-3">
          <label class="block text-xs font-medium text-slate-600">
            From
            <input
              v-model="from"
              type="date"
              data-testid="shp-print-from"
              :min="minDate"
              :max="maxDate"
              class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label class="block text-xs font-medium text-slate-600">
            Through
            <input
              v-model="to"
              type="date"
              data-testid="shp-print-to"
              :min="minDate"
              :max="maxDate"
              class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>

        <!-- WP-35 addendum 4: notes are internal reference (can contain clinic policy) —
             the caretaker-facing PDF omits them unless the operator explicitly opts in.
             Resets to CHECKED on every open; never persisted. -->
        <label class="mt-4 flex items-start gap-2 cursor-pointer">
          <input
            v-model="suppressNotes"
            type="checkbox"
            data-testid="shp-print-suppress-notes"
            class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-xs">
            <span class="font-medium text-slate-700">Suppress Notes</span>
            <span class="block text-[11px] text-slate-400">Uncheck to include session notes in the printed report.</span>
          </span>
        </label>

        <p v-if="rangeError" data-testid="shp-print-range-error" class="mt-2 text-xs text-red-600">
          {{ rangeError }}
        </p>
        <p v-if="fetchError" data-testid="shp-print-fetch-error" class="mt-2 text-xs text-red-600">
          {{ fetchError }}
        </p>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            data-testid="shp-print-cancel"
            class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="shp-print-confirm"
            class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!!rangeError || exporting"
            @click="onConfirm"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {{ exporting ? 'Preparing…' : 'Print / Save as PDF' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Print-only report (rulings G3+G4): hidden on screen, shown by @media print while the
         body carries shp-print-mode (which hides #app — see the unscoped style below). House
         precedent: CaretakerStatementScreen / TherapistStatementScreen window.print() pattern. -->
    <div v-if="printData" class="hidden print:block shp-print-root text-slate-900" data-testid="shp-print-root">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-slate-900">NeuroCorp Therapy Center</h1>
        <h2 class="text-lg font-semibold text-slate-700 mt-1">Session History</h2>
        <p class="text-sm text-slate-700 mt-1" data-testid="shp-print-patient">
          {{ printData.patientName }} · MRN <span class="font-mono">{{ printData.medicalRecordNumber || '—' }}</span>
        </p>
        <p class="text-xs text-slate-500 mt-1" data-testid="shp-print-range">
          Sessions from {{ formatDate(printData.from) }} through {{ formatDate(printData.to) }}
          · Printed on {{ formatDate(printData.printedOn) }}
        </p>
      </div>

      <!-- WP-35 addendum: summary/totals band over the FULL fetched in-range set (the same
           array the table below renders — never just one page). Owed mirrors the table's
           Paid/Owed column exactly: paid-off sessions contribute 0, others their amountDue. -->
      <div
        class="mb-4 grid grid-cols-5 gap-3 border-y border-slate-300 py-2 text-center"
        data-testid="shp-print-totals"
      >
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sessions</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-900" data-testid="shp-print-totals-count">{{ totals.count }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-900" data-testid="shp-print-totals-amount">{{ formatCurrency(totals.amount) }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Discount</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-900" data-testid="shp-print-totals-discount">{{ formatCurrency(totals.discount) }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Paid</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-900" data-testid="shp-print-totals-paid">{{ formatCurrency(totals.paid) }}</p>
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Owed</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-900" data-testid="shp-print-totals-owed">{{ formatCurrency(totals.owed) }}</p>
        </div>
      </div>

      <table class="min-w-full text-xs">
        <thead>
          <tr class="border-b border-slate-300 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th class="py-1.5 pr-2">Date</th>
            <th class="py-1.5 pr-2">Status</th>
            <th class="py-1.5 pr-2">Specialty</th>
            <th class="py-1.5 pr-2">Therapist</th>
            <th class="py-1.5 pr-2 text-right">Amount</th>
            <th class="py-1.5 pr-2 text-right">Discount</th>
            <th class="py-1.5 text-right">Paid / Owed</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="session in printData.sessions" :key="session.sessionId">
            <tr class="border-b border-slate-100" data-testid="shp-print-session-row">
              <td class="py-1.5 pr-2 whitespace-nowrap">{{ formatDate(session.sessionDate) }}</td>
              <td class="py-1.5 pr-2">{{ session.statusName }}</td>
              <td class="py-1.5 pr-2">{{ session.specialtyName || session.therapyTypes || '—' }}</td>
              <td class="py-1.5 pr-2">{{ session.therapist }}</td>
              <td class="py-1.5 pr-2 text-right">{{ formatCurrency(session.amount) }}</td>
              <td class="py-1.5 pr-2 text-right">{{ session.discount > 0 ? '-' + formatCurrency(session.discount) : '—' }}</td>
              <td class="py-1.5 text-right">
                {{ session.isPaidOff ? 'Paid ' + formatCurrency(session.amountPaid) : 'Owes ' + formatCurrency(session.amountDue) }}
              </td>
            </tr>
            <!-- Full note text inline beneath its row; sessions without notes omit the line.
                 printNotes is pre-sanitized (internal [LEGACY-IMPORT:]/[MERGED:] audit markers
                 stripped — external audience); a pure-marker note sanitizes to '' and the line
                 is omitted exactly as if the session had no notes. -->
            <tr v-if="session.printNotes" class="border-b border-slate-100">
              <td></td>
              <td colspan="6" class="py-1 pb-2 text-[11px] text-slate-600 whitespace-pre-wrap" data-testid="shp-print-note">
                <span class="font-semibold text-slate-500">Notes:</span> {{ session.printNotes }}
              </td>
            </tr>
          </template>
          <tr v-if="printData.sessions.length === 0">
            <td colspan="7" class="py-6 text-center text-slate-400">No sessions in the selected range.</td>
          </tr>
        </tbody>
      </table>

      <p class="mt-3 text-xs text-slate-500" data-testid="shp-print-count">
        {{ printData.sessions.length }} session{{ printData.sessions.length !== 1 ? 's' : '' }}
      </p>
    </div>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch, type PropType } from 'vue';
import type { PatientHistorySession, PatientSessionHistorySummary } from '../../interfaces/SessionHistory';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { formatCurrency } from '../../utils/formatCurrency';
import { sanitizePrintNotes } from '../../utils/sanitizePrintNotes';

// Server clamps pageSize at 100 (WP-30) — biggest legal page keeps the fetch-all loop short.
export const PRINT_FETCH_PAGE_SIZE = 100;

// A fetched session plus its print-safe note text (internal audit markers stripped —
// WP-35 addendum 3; the raw `notes` stays untouched for anything screen-facing).
type PrintSession = PatientHistorySession & { printNotes: string };

interface PrintData {
  patientName: string;
  medicalRecordNumber: string | null;
  from: string;
  to: string;
  printedOn: string;
  sessions: PrintSession[];
}

// WP-35 (SH-3): "Print / Save as PDF" for one patient's session history. Opens a date-range
// dialog (defaulted + clamped to the patient's actual first–last session span), fetches ALL
// sessions in the chosen range by looping the paged endpoint with from/to, then renders a
// print-only layout and calls window.print() — the browser dialog does the PDF (zero deps,
// same as the Statements screens).
export default defineComponent({
  name: 'SessionHistoryPrintDialog',
  props: {
    patient: { type: Object as PropType<PatientSessionHistorySummary | null>, default: null },
    visible: { type: Boolean, default: false },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const client = new PatientsHttpClient();
    const from = ref('');
    const to = ref('');
    const exporting = ref(false);
    const fetchError = ref('');
    const printData = ref<PrintData | null>(null);
    // WP-35 addendum 4: suppress notes in the printed report by default; the operator must
    // explicitly opt in per print. Reset to true on every dialog open (safe default).
    const suppressNotes = ref(true);

    // Clamp bounds = the patient's actual session span. firstSessionDate may be absent (older
    // API during rollout) — then the lower bound is simply unclamped.
    const minDate = computed(() => props.patient?.firstSessionDate ?? undefined);
    const maxDate = computed(() => props.patient?.lastSessionDate ?? undefined);

    // Reset to the full span each time the dialog opens for a patient.
    watch(
      () => [props.visible, props.patient?.patientId] as const,
      ([visible]) => {
        if (!visible || !props.patient) return;
        from.value = props.patient.firstSessionDate ?? props.patient.lastSessionDate ?? '';
        to.value = props.patient.lastSessionDate ?? '';
        suppressNotes.value = true; // safe default every open — an unchecked state never persists
        fetchError.value = '';
        printData.value = null;
      },
      { immediate: true },
    );

    // The native pickers enforce min/max, but typed input can escape them — validate in code
    // too so Confirm stays disabled for any out-of-span or inverted range.
    const rangeError = computed(() => {
      if (!from.value || !to.value) return 'Select both dates.';
      if (from.value > to.value) return 'From must be on or before Through.';
      if (minDate.value && from.value < minDate.value) {
        return `Dates are limited to this patient's sessions (from ${formatDate(minDate.value)}).`;
      }
      if (maxDate.value && to.value > maxDate.value) {
        return `Dates are limited to this patient's sessions (through ${formatDate(maxDate.value)}).`;
      }
      return '';
    });

    // WP-35 addendum: totals over the FULL fetched set. Owed mirrors PatientSessionsTable's
    // Paid/Owed cell verbatim (`isPaidOff ? Paid : Owes amountDue`) — the server-computed
    // amountDue is trusted, gated by isPaidOff; nothing is re-derived from amount/discount.
    // Null-safe (`?? 0`) so a sparse payload can never yield NaN. Cancelled/zeroed sessions
    // simply contribute their (zero) amounts; the count includes every rendered session.
    const totals = computed(() => {
      const sessions = printData.value?.sessions ?? [];
      return sessions.reduce(
        (acc, s) => {
          acc.count += 1;
          acc.amount += s.amount ?? 0;
          acc.discount += s.discount ?? 0;
          acc.paid += s.amountPaid ?? 0;
          acc.owed += s.isPaidOff ? 0 : (s.amountDue ?? 0);
          return acc;
        },
        { count: 0, amount: 0, discount: 0, paid: 0, owed: 0 },
      );
    });

    const fetchAllInRange = async (patientId: number): Promise<PatientHistorySession[]> => {
      const all: PatientHistorySession[] = [];
      let page = 1;
      let totalCount = Number.POSITIVE_INFINITY;
      while (all.length < totalCount) {
        const result = await client.getPatientSessions(patientId, page, PRINT_FETCH_PAGE_SIZE, from.value, to.value);
        all.push(...result.items);
        totalCount = result.totalCount;
        if (result.items.length === 0) break; // defensive: never loop on a short page
        page += 1;
      }
      return all;
    };

    const onConfirm = async () => {
      if (!props.patient || rangeError.value || exporting.value) return;
      exporting.value = true;
      fetchError.value = '';
      try {
        const fetched = await fetchAllInRange(props.patient.patientId);
        // The endpoint returns newest-first; a printed history reads chronologically.
        fetched.sort((a, b) =>
          (a.sessionDate + a.sessionTime).localeCompare(b.sessionDate + b.sessionTime));
        // Suppressed (default) → no note lines at all. Opted in → notes still ALWAYS pass
        // through the addendum-3 sanitizer — unchecking reveals sanitized notes, never raw
        // internal markers. Raw notes untouched elsewhere (screen popover).
        const sessions: PrintSession[] = fetched.map((s) => ({
          ...s,
          printNotes: suppressNotes.value ? '' : sanitizePrintNotes(s.notes),
        }));
        printData.value = {
          patientName: props.patient.patientName,
          medicalRecordNumber: props.patient.medicalRecordNumber,
          from: from.value,
          to: to.value,
          printedOn: toIsoDate(new Date()),
          sessions,
        };
        await nextTick(); // let the print-only layout render before opening the print dialog
        document.body.classList.add('shp-print-mode');
        window.print();
        document.body.classList.remove('shp-print-mode');
        emit('close');
      } catch {
        fetchError.value = 'Failed to load sessions for the selected range.';
      } finally {
        exporting.value = false;
      }
    };

    const toIsoDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    // Never leave the body stuck in print mode (e.g. unmount mid-flow).
    onBeforeUnmount(() => document.body.classList.remove('shp-print-mode'));

    return {
      from, to, minDate, maxDate, rangeError, fetchError, exporting, printData, totals,
      suppressNotes, onConfirm, formatDate, formatCurrency,
    };
  },
});
</script>

<style>
/* WP-35 (SH-3): while the session-history report is being printed, hide the app itself —
   the report is teleported to <body>, outside #app, so it is the only thing that prints.
   Unscoped on purpose: it targets elements outside this component's tree. */
@media print {
  body.shp-print-mode #app {
    display: none !important;
  }
}
</style>
