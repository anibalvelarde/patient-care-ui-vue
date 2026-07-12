<template>
  <div class="border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden">
    <!-- Loading -->
    <div v-if="loading" class="py-6 text-center">
      <div class="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-1 text-xs text-slate-500">Loading sessions...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-4 px-4 text-center">
      <p class="text-xs text-red-700">{{ error }}</p>
      <button class="mt-1 text-xs font-medium text-red-600 hover:text-red-800" @click="load(page)">
        Try again
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="result && result.totalCount === 0" class="py-6 text-center text-xs text-slate-400">
      No sessions on record for this patient.
    </div>

    <template v-else-if="result">
      <!-- Column headers (desktop) -->
      <div class="hidden md:grid grid-cols-[6rem_1fr_1fr_5rem_5rem_5.5rem_1rem] gap-2 px-4 py-2 bg-slate-100/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <span>Date</span>
        <span>Specialty</span>
        <span>Therapist</span>
        <span class="text-right">Amount</span>
        <span class="text-right">Discount</span>
        <span class="text-right">Paid</span>
        <span></span>
      </div>

      <!-- Session rows: read-only, each links to the Dashboard view of that session -->
      <div class="divide-y divide-slate-100">
        <router-link
          v-for="session in result.items"
          :key="session.sessionId"
          :to="dashboardLink(session)"
          class="block px-4 py-2 hover:bg-blue-50/60 transition-colors group"
        >
          <!-- Desktop grid row -->
          <div class="hidden md:grid grid-cols-[6rem_1fr_1fr_5rem_5rem_5.5rem_1rem] gap-2 items-center text-xs">
            <span class="text-slate-500">{{ formatDate(session.sessionDate) }}</span>
            <span class="text-slate-700">{{ session.specialtyName || session.therapyTypes || '—' }}</span>
            <span class="text-slate-600">{{ session.therapist }}</span>
            <span class="text-right text-slate-600">{{ formatCurrency(session.amount) }}</span>
            <span class="text-right" :class="session.discount > 0 ? 'text-green-600' : 'text-slate-400'">
              {{ session.discount > 0 ? '-' + formatCurrency(session.discount) : '—' }}
            </span>
            <span class="text-right">
              <span
                v-if="session.isPaidOff"
                class="inline-flex items-center space-x-1 text-green-700"
                :title="'Paid ' + formatCurrency(session.amountPaid)"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ formatCurrency(session.amountPaid) }}</span>
              </span>
              <span v-else class="text-amber-700" :title="formatCurrency(session.amountDue) + ' due'">
                {{ formatCurrency(session.amountPaid) }}
              </span>
            </span>
            <svg class="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>

          <!-- Mobile stacked row -->
          <div class="md:hidden text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-medium text-slate-700">{{ formatDate(session.sessionDate) }}</span>
              <span
                :class="session.isPaidOff ? 'text-green-700' : 'text-amber-700'"
                class="font-medium"
              >
                {{ session.isPaidOff ? '✓ ' : '' }}{{ formatCurrency(session.amountPaid) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-slate-500">
              <span>{{ session.specialtyName || session.therapyTypes || '—' }} · {{ session.therapist }}</span>
              <span>{{ formatCurrency(session.amount) }}<template v-if="session.discount > 0"> · -{{ formatCurrency(session.discount) }}</template></span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Paging footer -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-2 bg-slate-100/70 text-xs text-slate-500">
        <button
          class="px-2 py-1 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page <= 1 || loading"
          @click="load(page - 1)"
        >
          ◀ Prev
        </button>
        <span>Page {{ page }} of {{ totalPages }} · {{ result.totalCount }} sessions</span>
        <button
          class="px-2 py-1 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page >= totalPages || loading"
          @click="load(page + 1)"
        >
          Next ▶
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import type { PagedResult, PatientHistorySession } from '../../interfaces/SessionHistory';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { formatCurrency } from '../../utils/formatCurrency';

export const SESSIONS_PAGE_SIZE = 25;

export default defineComponent({
  name: 'PatientSessionsTable',
  props: {
    patientId: { type: Number, required: true },
  },
  setup(props) {
    const client = new PatientsHttpClient();
    const result = ref<PagedResult<PatientHistorySession> | null>(null);
    const page = ref(1);
    const loading = ref(false);
    const error = ref('');

    const totalPages = computed(() =>
      result.value ? Math.max(1, Math.ceil(result.value.totalCount / result.value.pageSize)) : 1,
    );

    const load = async (targetPage: number) => {
      loading.value = true;
      error.value = '';
      try {
        result.value = await client.getPatientSessions(props.patientId, targetPage, SESSIONS_PAGE_SIZE);
        page.value = targetPage;
      } catch {
        error.value = 'Failed to load sessions.';
      } finally {
        loading.value = false;
      }
    };

    // Read-only rows link to the session on the Dashboard; `from` powers the back banner
    // (same mechanism as the Delinquent tab rows).
    const dashboardLink = (session: PatientHistorySession) => ({
      path: '/',
      query: {
        date: session.sessionDate,
        highlightSession: String(session.sessionId),
        from: '/patients?tab=sessions',
      },
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    onMounted(() => load(1));

    return { result, page, loading, error, totalPages, load, dashboardLink, formatDate, formatCurrency };
  },
});
</script>
