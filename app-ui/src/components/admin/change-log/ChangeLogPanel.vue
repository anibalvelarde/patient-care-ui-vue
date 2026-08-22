<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200" data-testid="changelog-panel">
    <!-- header -->
    <div class="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 no-print">
      <div>
        <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
          Change Log
          <span class="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">SYSADMIN</span>
        </h2>
        <p class="text-sm text-slate-500 mt-0.5 max-w-xl">
          Who changed what, and when — across patients, sessions, payments and settings. The log records
          <strong>which fields changed</strong>, never their values.
        </p>
      </div>
      <button
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
        data-testid="changelog-print"
        @click="printReport"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / Save as PDF
      </button>
    </div>

    <div class="p-6 space-y-5">
      <!-- filter bar -->
      <div class="space-y-3 no-print">
        <div class="flex flex-wrap items-center gap-4">
          <DateRangeQuickFilter @change="onRangeChange" />
        </div>
        <div class="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div class="w-64">
            <LookupSelect
              :model-value="userFilter"
              label="User"
              placeholder="Filter by user…"
              :fetch-options="fetchUsers"
              test-id="changelog-user"
              @update:model-value="onUserSelected"
            />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Record type</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                class="text-xs px-3 py-1 rounded-full border"
                :class="chipClass(query.entityType == null)"
                data-testid="changelog-entity-all"
                @click="setEntity(null)"
              >All</button>
              <button
                v-for="et in entityTypes"
                :key="et.entityType"
                class="text-xs px-3 py-1 rounded-full border"
                :class="chipClass(query.entityType === et.entityType)"
                data-testid="changelog-entity-chip"
                @click="setEntity(et.entityType)"
              >{{ et.displayName }}</button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Action</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="a in actionOptions"
                :key="a.value ?? 'all'"
                class="text-xs px-3 py-1 rounded-full border"
                :class="chipClass(query.action == (a.value ?? null))"
                :data-testid="`changelog-action-${a.label.toLowerCase()}`"
                @click="setAction(a.value)"
              >{{ a.label }}</button>
            </div>
          </div>
          <button
            v-if="hasActiveFilters"
            class="text-xs text-blue-600 hover:text-blue-800 self-end pb-1"
            data-testid="changelog-clear"
            @click="clearFilters"
          >Clear filters</button>
        </div>
      </div>

      <FormErrorBanner :message="error" />

      <div v-if="loading" class="text-center py-10 no-print" data-testid="changelog-loading">
        <div class="inline-block w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <ChangeLogSummary
          :summary="summary"
          @filter-user="onFilterUser"
          @filter-entity="setEntity"
          @change-group="onChangeGroup"
        />

        <div class="pt-2 no-print">
          <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Detail</h3>
          <ChangeLogTable :paged="list" :loading="loading" @page="onPage" @filter-correlation="onFilterCorrelation" />
        </div>
      </template>

      <!-- print-only report footer -->
      <div class="print-only hidden text-xs text-slate-500 border-t border-slate-200 pt-3 mt-4">
        Generated {{ generatedAtLabel }} · {{ tzName }} · Neurocorp Patient Care — records which fields changed, not their values.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, nextTick } from 'vue';
import DateRangeQuickFilter, { type RangeChange } from '../../shared/DateRangeQuickFilter.vue';
import LookupSelect, { type LookupOption } from '../../shared/LookupSelect.vue';
import FormErrorBanner from '../../shared/FormErrorBanner.vue';
import ChangeLogSummary from './ChangeLogSummary.vue';
import ChangeLogTable, { PAGE_SIZE } from './ChangeLogTable.vue';
import { ChangeLogHttpClient } from '../../../services/ChangeLogHttpClient';
import { AdminUsersHttpClient } from '../../../services/AdminUsersHttpClient';
import { useFormError } from '../../../composables/useFormError';
import { observerOffsetMinutes, observerTimeZoneName, formatObserverDateTime } from '../../../utils/observerTime';
import type {
  ChangeLogSummary as Summary, ChangeLogEntry, ChangeLogQuery,
  ChangeAction, ChangeLogGroupBy, ChangeLogEntityTypeInfo,
} from '../../../interfaces/ChangeLog';
import type { PagedResult } from '../../../interfaces/SessionHistory';

export default defineComponent({
  name: 'ChangeLogPanel',
  components: { DateRangeQuickFilter, LookupSelect, FormErrorBanner, ChangeLogSummary, ChangeLogTable },
  setup() {
    const client = new ChangeLogHttpClient();
    const usersClient = new AdminUsersHttpClient();
    const { message: error, setFromException, clear: clearError } = useFormError();

    const summary = ref<Summary | null>(null);
    const list = ref<PagedResult<ChangeLogEntry> | null>(null);
    const entityTypes = ref<ChangeLogEntityTypeInfo[]>([]);
    const userFilter = ref<LookupOption | null>(null);
    const loading = ref(false);
    const generatedAt = ref<Date>(new Date());
    const tzName = observerTimeZoneName();

    const query = reactive<ChangeLogQuery>({
      fromUtc: '', toUtc: '', tzOffsetMinutes: observerOffsetMinutes(),
      groupBy: 'day', userId: null, entityType: null, entityId: null, action: null,
      correlationId: null, page: 1, pageSize: PAGE_SIZE,
    });

    const actionOptions: { label: string; value: ChangeAction | null }[] = [
      { label: 'All', value: null },
      { label: 'Insert', value: 'Insert' },
      { label: 'Update', value: 'Update' },
      { label: 'Delete', value: 'Delete' },
    ];

    const hasActiveFilters = computed(() =>
      query.userId != null || query.entityType != null || query.action != null || query.correlationId != null);

    const generatedAtLabel = computed(() => formatObserverDateTime(generatedAt.value.toISOString()));

    const chipClass = (active: boolean): string =>
      active ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';

    async function fetchUsers(q: string): Promise<LookupOption[]> {
      const options: LookupOption[] = [];
      if ('system'.includes(q.toLowerCase())) {
        options.push({ id: 0, name: 'System', detail: 'imports · no request user' });
      }
      const result = await usersClient.getUsers({ search: q, pageSize: 10 });
      for (const u of result.items) {
        options.push({ id: u.userId, name: `${u.lastName}, ${u.firstName}`, detail: u.email });
      }
      return options;
    }

    async function reloadSummary(): Promise<void> {
      summary.value = await client.getSummary(query);
    }

    async function reloadList(): Promise<void> {
      list.value = await client.list(query);
    }

    async function reloadAll(): Promise<void> {
      loading.value = true;
      clearError();
      try {
        await Promise.all([reloadSummary(), reloadList()]);
      } catch (e) {
        setFromException(e, 'Failed to load the change log.');
      } finally {
        loading.value = false;
      }
    }

    // --- filter handlers (each resets to page 1 and narrows both blocks) ---
    function onRangeChange(range: RangeChange): void {
      query.fromUtc = range.fromUtc;
      query.toUtc = range.toUtc;
      query.page = 1;
      if (query.fromUtc && query.toUtc) {
        reloadAll();
      }
    }

    function setEntity(entityType: string | null): void {
      query.entityType = entityType;
      query.page = 1;
      reloadAll();
    }

    function setAction(action: ChangeAction | null): void {
      query.action = action;
      query.page = 1;
      reloadAll();
    }

    function onUserSelected(option: LookupOption | null): void {
      userFilter.value = option;
      query.userId = option?.id ?? null;
      query.page = 1;
      reloadAll();
    }

    function onFilterUser(userId: number): void {
      const row = summary.value?.byUser.find((u) => u.userId === userId);
      onUserSelected({ id: userId, name: row?.displayName ?? (userId === 0 ? 'System' : `#${userId}`) });
    }

    function onFilterCorrelation(correlationId: string): void {
      query.correlationId = correlationId;
      query.page = 1;
      reloadList();
    }

    async function onChangeGroup(groupBy: ChangeLogGroupBy): Promise<void> {
      query.groupBy = groupBy;
      loading.value = true;
      clearError();
      try {
        await reloadSummary();
      } catch (e) {
        setFromException(e, 'Failed to load the change log.');
      } finally {
        loading.value = false;
      }
    }

    function onPage(page: number): void {
      query.page = page;
      reloadList();
    }

    function clearFilters(): void {
      userFilter.value = null;
      query.userId = null;
      query.entityType = null;
      query.action = null;
      query.correlationId = null;
      query.page = 1;
      reloadAll();
    }

    function printReport(): void {
      generatedAt.value = new Date();
      nextTick(() => window.print());
    }

    onMounted(async () => {
      try {
        entityTypes.value = await client.getEntityTypes();
      } catch {
        entityTypes.value = [];
      }
      // The initial range is emitted by DateRangeQuickFilter's onMounted → triggers reloadAll.
    });

    return {
      // state
      summary, list, entityTypes, userFilter, loading, error, query,
      actionOptions, hasActiveFilters, generatedAtLabel, tzName,
      // helpers
      chipClass, fetchUsers,
      // handlers
      onRangeChange, setEntity, setAction, onUserSelected, onFilterUser, onFilterCorrelation,
      onChangeGroup, onPage, clearFilters, printReport,
    };
  },
});
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
}
</style>
