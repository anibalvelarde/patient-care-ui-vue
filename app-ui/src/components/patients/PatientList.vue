<template>
  <div class="space-y-4">
    <!-- Top bar: Search + Add button -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search patients..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        v-if="hasClaim('Permission', Permissions.PatientsEdit)"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        @click="$emit('add')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Patient</span>
      </button>
    </div>

    <!-- Filter tabs + count -->
    <div class="flex items-center justify-between">
      <div class="inline-flex rounded-lg bg-slate-100 p-0.5">
        <button
          v-for="tab in visibleTabs"
          :key="tab.value"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeFilter === tab.value
              ? tab.value === 'delinquent'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="onTabClick(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <!-- Session History paints its own (server-side) count in its paging footer. -->
      <span v-if="activeFilter !== 'delinquent' && activeFilter !== 'sessions'" class="text-sm text-slate-500">
        {{ totalCount }} patient{{ totalCount !== 1 ? 's' : '' }}
      </span>
      <span v-else-if="activeFilter === 'delinquent'" class="text-sm text-amber-600">
        {{ pastDuePatients.length }} patient{{ pastDuePatients.length !== 1 ? 's' : '' }} past due
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-slate-500">Loading patients...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 rounded-xl p-6 text-center">
      <p class="text-sm text-red-700">{{ error }}</p>
      <button
        class="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>

    <!-- Delinquent tab -->
    <DelinquentTable
      v-else-if="activeFilter === 'delinquent'"
      :patients="pastDuePatients"
      :search="search"
      @pay="(dp) => $emit('pay-delinquent', dp)"
    />

    <!-- Session History tab (WP-21, F1) — self-loading, server-paged -->
    <SessionHistoryPanel
      v-else-if="activeFilter === 'sessions'"
      :search="search"
    />

    <!-- Standard patient table (WP-30: server-paged — rows are the current page only) -->
    <template v-else>
      <PatientTable
        :patients="patients"
        @edit="(p) => $emit('edit', p)"
        @toggle-active="(p) => $emit('toggle-active', p)"
        @view-caretakers="(p) => $emit('view-caretakers', p)"
        @view-plans="(p) => $emit('view-plans', p)"
      />

      <!-- Paging footer (WP-30, SessionHistoryPanel pattern) -->
      <div class="flex items-center justify-between text-sm text-slate-500">
        <button
          class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page <= 1 || loading"
          @click="goToPage(page - 1)"
        >
          ◀ Prev
        </button>
        <span>
          Page {{ page }} of {{ totalPages }}
        </span>
        <button
          class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
          :disabled="page >= totalPages || loading"
          @click="goToPage(page + 1)"
        >
          Next ▶
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, type PropType } from 'vue';
import type { Patient } from '../../interfaces/Patient';
import type { DelinquentPatient } from '../../interfaces/Delinquency';
import { useClaims, Permissions } from '../../composables/useClaims';
import PatientTable from './PatientTable.vue';
import DelinquentTable from './DelinquentTable.vue';
import SessionHistoryPanel from './SessionHistoryPanel.vue';

export const SEARCH_DEBOUNCE_MS = 300;

type PatientTabValue = 'all' | 'active' | 'inactive' | 'delinquent' | 'sessions';

// WP-30 (U2): what the parent view feeds into client.getPatients — the tabs/search/pager
// here no longer filter client-side; they re-query the server through this payload.
export interface PatientListQuery {
  search: string;
  isActive?: boolean;
  page: number;
}

export default defineComponent({
  name: 'PatientList',
  components: { PatientTable, DelinquentTable, SessionHistoryPanel },
  props: {
    // WP-30: the current server page, not the census.
    patients: { type: Array as PropType<Patient[]>, required: true },
    totalCount: { type: Number, default: 0 },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 30 },
    pastDuePatients: { type: Array as PropType<DelinquentPatient[]>, default: () => [] },
    initialTab: { type: String as PropType<PatientTabValue>, default: 'all' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['add', 'edit', 'toggle-active', 'retry', 'tab-change', 'query-change', 'view-caretakers', 'view-plans', 'pay-delinquent'],
  setup(props, { emit }) {
    const { hasClaim } = useClaims();
    const search = ref('');
    const activeFilter = ref<PatientTabValue>(props.initialTab);

    onMounted(() => {
      if (props.initialTab !== 'all') {
        emit('tab-change', props.initialTab);
      }
    });

    const tabs = [
      { label: 'All', value: 'all' as const },
      { label: 'Active', value: 'active' as const },
      { label: 'Inactive', value: 'inactive' as const },
      { label: 'Delinquent', value: 'delinquent' as const, claim: Permissions.PatientsDelinquentView },
      // WP-21 (F1): rides the page claim — visible to everyone who can open /patients
      // (ACCT/AM/FD/MGR/OWN + SYSADMIN); explicit for symmetry with Delinquent.
      { label: 'Session History', value: 'sessions' as const, claim: Permissions.PatientsView },
    ];

    // The Delinquent tab is gated on Patients.Delinquent.View (FD excluded). Filtering it from the
    // tab list also makes it unreachable directly — the past-due data load only fires on tab-change.
    const visibleTabs = computed(() =>
      tabs.filter((t) => !('claim' in t) || hasClaim('Permission', t.claim as string)),
    );

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(props.totalCount / props.pageSize)),
    );

    // WP-30: the Active/Inactive tabs are the server's isActive param, not a client filter.
    const isActiveParam = (): boolean | undefined => {
      if (activeFilter.value === 'active') return true;
      if (activeFilter.value === 'inactive') return false;
      return undefined;
    };

    const emitQuery = (page: number) => {
      emit('query-change', { search: search.value.trim(), isActive: isActiveParam(), page } as PatientListQuery);
    };

    const onTabClick = (value: PatientTabValue) => {
      activeFilter.value = value;
      emit('tab-change', value);
      // Server tabs re-query (also picks up a search term typed while on another tab).
      if (value === 'all' || value === 'active' || value === 'inactive') {
        emitQuery(1);
      }
    };

    const goToPage = (page: number) => emitQuery(page);

    // Debounced server-side search; a new term restarts from page 1. The Delinquent and
    // Session History tabs consume `search` themselves (props), so no re-query there.
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    watch(search, () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (activeFilter.value === 'delinquent' || activeFilter.value === 'sessions') return;
        emitQuery(1);
      }, SEARCH_DEBOUNCE_MS);
    });

    return { search, activeFilter, visibleTabs, totalPages, onTabClick, goToPage, hasClaim, Permissions };
  },
});
</script>
