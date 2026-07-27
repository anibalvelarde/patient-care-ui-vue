<template>
  <div class="space-y-3">
    <!-- Loading (initial) -->
    <div v-if="loading && !result" class="text-center py-12">
      <div class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-slate-500">Loading session history...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 rounded-xl p-6 text-center">
      <p class="text-sm text-red-700">{{ error }}</p>
      <button class="mt-2 text-sm font-medium text-red-600 hover:text-red-800" @click="load(page)">
        Try again
      </button>
    </div>

    <template v-else-if="result">
      <!-- Desktop table -->
      <div class="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-blue-50 border-b border-blue-100">
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider w-8"></th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Patient</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">MRN</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">From</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Last Session</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Sessions</th>
              <th class="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="p in result.items" :key="p.patientId">
              <tr
                class="hover:bg-blue-50/40 transition-colors cursor-pointer"
                @click="toggleExpand(p.patientId)"
              >
                <td class="px-4 py-3 text-sm text-slate-400">
                  <svg
                    :class="['w-4 h-4 transition-transform', expanded.has(p.patientId) ? 'rotate-90' : '']"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ p.patientName }}</td>
                <td class="px-4 py-3 text-sm text-slate-500 font-mono">{{ p.medicalRecordNumber || '—' }}</td>
                <!-- WP-35 (SH-1): first-session date so the row reads From/Through. Tolerates
                     the field being absent (older API during rollout) — renders "—". -->
                <td class="px-4 py-3 text-sm text-slate-600" data-testid="session-history-from">
                  {{ formatDate(p.firstSessionDate ?? '') || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(p.lastSessionDate ?? '') || '—' }}</td>
                <td class="px-4 py-3 text-sm">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {{ p.totalSessions }}
                  </span>
                </td>
                <!-- WP-35 (SH-3): print/save-as-PDF for this patient's sessions -->
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    data-testid="session-history-print"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="p.totalSessions === 0"
                    title="Print / Save as PDF"
                    aria-label="Print / Save as PDF"
                    @click.stop="openPrint(p)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="expanded.has(p.patientId)" class="bg-slate-50/40">
                <td class="px-4 py-2"></td>
                <td colspan="6" class="px-4 py-2">
                  <PatientSessionsTable :patient-id="p.patientId" />
                </td>
              </tr>
            </template>
            <tr v-if="result.items.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-sm text-slate-400">
                No patients found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-3">
        <div
          v-for="p in result.items"
          :key="p.patientId"
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="p-4 cursor-pointer" @click="toggleExpand(p.patientId)">
            <div class="flex items-start justify-between mb-1">
              <div class="flex items-center space-x-2">
                <svg
                  :class="['w-4 h-4 text-slate-400 transition-transform', expanded.has(p.patientId) ? 'rotate-90' : '']"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <p class="text-sm font-semibold text-slate-800">{{ p.patientName }}</p>
              </div>
              <div class="flex items-center gap-1">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {{ p.totalSessions }}
                </span>
                <!-- WP-35 (SH-3): print/save-as-PDF for this patient's sessions -->
                <button
                  type="button"
                  data-testid="session-history-print-mobile"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="p.totalSessions === 0"
                  title="Print / Save as PDF"
                  aria-label="Print / Save as PDF"
                  @click.stop="openPrint(p)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="text-xs text-slate-500">
              <span class="font-mono">{{ p.medicalRecordNumber || '—' }}</span>
              <span class="mx-1 text-slate-300">·</span>
              <!-- WP-35 (SH-1): From/Last span on the mobile card too -->
              <span class="font-medium">From:</span> {{ formatDate(p.firstSessionDate ?? '') || '—' }}
              <span class="mx-1 text-slate-300">·</span>
              <span class="font-medium">Last:</span> {{ formatDate(p.lastSessionDate ?? '') || '—' }}
            </div>
          </div>
          <div v-if="expanded.has(p.patientId)" class="border-t border-slate-100 p-2">
            <PatientSessionsTable :patient-id="p.patientId" />
          </div>
        </div>
        <div v-if="result.items.length === 0" class="text-center py-12 text-sm text-slate-400">
          No patients found.
        </div>
      </div>

      <!-- Paging footer -->
      <div class="flex items-center justify-between text-sm text-slate-500">
        <button
          class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page <= 1 || loading"
          @click="load(page - 1)"
        >
          ◀ Prev
        </button>
        <span>
          Page {{ page }} of {{ totalPages }} · {{ result.totalCount }} patient{{ result.totalCount !== 1 ? 's' : '' }}
        </span>
        <button
          class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page >= totalPages || loading"
          @click="load(page + 1)"
        >
          Next ▶
        </button>
      </div>

      <!-- WP-35 (SH-3): date-range dialog + print-only report for the selected patient -->
      <SessionHistoryPrintDialog
        :patient="printPatient"
        :visible="printPatient !== null"
        @close="printPatient = null"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import type { PagedResult, PatientSessionHistorySummary } from '../../interfaces/SessionHistory';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import PatientSessionsTable from './PatientSessionsTable.vue';
import SessionHistoryPrintDialog from './SessionHistoryPrintDialog.vue';

export const PATIENTS_PAGE_SIZE = 30;
export const SEARCH_DEBOUNCE_MS = 300;

export default defineComponent({
  name: 'SessionHistoryPanel',
  components: { PatientSessionsTable, SessionHistoryPrintDialog },
  props: {
    // Fed by the Patients page's shared search box; unlike the other tabs this searches
    // SERVER-side (the patient list is server-paged so client filtering would miss rows).
    search: { type: String, default: '' },
  },
  setup(props) {
    const client = new PatientsHttpClient();
    const result = ref<PagedResult<PatientSessionHistorySummary> | null>(null);
    const page = ref(1);
    const loading = ref(false);
    const error = ref('');
    const expanded = ref<Set<number>>(new Set());

    const totalPages = computed(() =>
      result.value ? Math.max(1, Math.ceil(result.value.totalCount / result.value.pageSize)) : 1,
    );

    const load = async (targetPage: number) => {
      loading.value = true;
      error.value = '';
      try {
        result.value = await client.getSessionHistory(props.search, targetPage, PATIENTS_PAGE_SIZE);
        page.value = targetPage;
      } catch {
        error.value = 'Failed to load session history.';
      } finally {
        loading.value = false;
      }
    };

    // WP-35 (SH-3): which patient the print date-range dialog is open for (null = closed).
    const printPatient = ref<PatientSessionHistorySummary | null>(null);
    const openPrint = (p: PatientSessionHistorySummary) => {
      printPatient.value = p;
    };

    const toggleExpand = (patientId: number) => {
      const next = new Set(expanded.value);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      expanded.value = next;
    };

    // Debounced server-side search; a new term restarts from page 1.
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    watch(
      () => props.search,
      () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          expanded.value = new Set();
          load(1);
        }, SEARCH_DEBOUNCE_MS);
      },
    );

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    onMounted(() => load(1));

    return { result, page, loading, error, expanded, totalPages, load, toggleExpand, formatDate, printPatient, openPrint };
  },
});
</script>
