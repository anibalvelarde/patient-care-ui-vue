<template>
  <div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm" data-testid="changelog-table">
        <thead>
          <tr class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <th class="py-2 pr-4">Time</th>
            <th class="py-2 pr-4">User</th>
            <th class="py-2 pr-4">Action</th>
            <th class="py-2 pr-4">Record</th>
            <th class="py-2 pr-4">Fields changed</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!paged || paged.items.length === 0">
            <td colspan="6" class="py-8 text-center text-slate-400" data-testid="changelog-empty">No changes match these filters.</td>
          </tr>
          <template v-for="row in paged?.items ?? []" :key="row.id">
            <tr class="border-b border-slate-100 hover:bg-slate-50" data-testid="changelog-row">
              <td class="py-2.5 pr-4 whitespace-nowrap">
                <span class="font-medium text-slate-800">{{ formatTime(row.occurredAtUtc) }}</span>
                <span class="block text-[11px] text-slate-400">{{ formatDate(row.occurredAtUtc) }}</span>
              </td>
              <td class="py-2.5 pr-4 font-medium text-slate-700">{{ row.user.displayName }}</td>
              <td class="py-2.5 pr-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" :class="badgeClass(row.action)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(row.action)"></span>{{ row.action }}
                </span>
              </td>
              <td class="py-2.5 pr-4">
                <span class="font-semibold text-slate-700">{{ row.entityType }}</span>
                <span class="block text-[11px] text-slate-400">{{ row.entityLabel || ('#' + row.entityId) }}</span>
              </td>
              <td class="py-2.5 pr-4">
                <div v-if="row.action === 'Update'" class="flex flex-wrap gap-1 items-center">
                  <span v-for="f in row.changedFields.slice(0, 3)" :key="f" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">{{ f }}</span>
                  <span v-if="row.changedFields.length > 3" class="text-[11px] text-slate-400">+{{ row.changedFields.length - 3 }} more</span>
                  <button
                    v-if="row.correlationId"
                    class="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700"
                    @click="$emit('filter-correlation', row.correlationId)"
                  >same request</button>
                </div>
                <span v-else-if="row.action === 'Insert'" class="text-[11px] text-emerald-600 font-medium">New record · {{ row.changedFields.length }} fields set</span>
                <span v-else class="text-[11px] text-rose-600 font-medium">Record removed · {{ row.changedFields.length }} fields</span>
              </td>
              <td class="py-2.5 text-right">
                <button
                  v-if="row.changedFields.length > 0"
                  class="text-slate-400 hover:text-violet-600"
                  :data-testid="`change-row-toggle-${row.id}`"
                  :aria-label="expandedId === row.id ? 'Collapse' : 'Expand'"
                  @click="toggle(row.id)"
                >
                  <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-90': expandedId === row.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="expandedId === row.id" class="bg-violet-50/40 border-b border-violet-100">
              <td colspan="6" class="px-6 py-3">
                <p class="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2" :data-testid="`change-fields-${row.id}`">
                  {{ row.changedFields.length }} field{{ row.changedFields.length === 1 ? '' : 's' }} changed
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="f in row.changedFields" :key="f" class="text-xs px-2.5 py-1 rounded-md bg-white border border-violet-200 text-violet-800 font-medium">{{ f }}</span>
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  Before/after values are <strong>not recorded</strong> — the log shows which fields changed, never their contents.
                </p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="paged" class="flex items-center justify-between text-sm text-slate-500 mt-4">
      <button
        class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
        :disabled="paged.page <= 1 || loading"
        data-testid="changelog-prev"
        @click="$emit('page', paged.page - 1)"
      >◀ Prev</button>
      <span data-testid="changelog-page-label">Page {{ paged.page }} of {{ totalPages }} · {{ paged.totalCount }} change{{ paged.totalCount === 1 ? '' : 's' }}</span>
      <button
        class="px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 hover:bg-blue-50"
        :disabled="paged.page >= totalPages || loading"
        data-testid="changelog-next"
        @click="$emit('page', paged.page + 1)"
      >Next ▶</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import type { PagedResult } from '../../../interfaces/SessionHistory';
import type { ChangeLogEntry, ChangeAction } from '../../../interfaces/ChangeLog';
import { formatObserverTime, formatObserverDate } from '../../../utils/observerTime';

export const PAGE_SIZE = 25;

export default defineComponent({
  name: 'ChangeLogTable',
  props: {
    paged: { type: Object as PropType<PagedResult<ChangeLogEntry> | null>, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['page', 'filter-correlation'],
  setup(props) {
    const expandedId = ref<number | null>(null);
    const totalPages = computed(() =>
      Math.max(1, Math.ceil((props.paged?.totalCount ?? 0) / PAGE_SIZE)));

    // Collapse the expander when the page reloads.
    watch(() => props.paged, () => { expandedId.value = null; });

    const toggle = (id: number): void => {
      expandedId.value = expandedId.value === id ? null : id;
    };

    const badgeClass = (a: ChangeAction): string => ({
      Insert: 'bg-emerald-50 text-emerald-700',
      Update: 'bg-amber-50 text-amber-700',
      Delete: 'bg-rose-50 text-rose-700',
    }[a]);

    const dotClass = (a: ChangeAction): string => ({
      Insert: 'bg-emerald-500',
      Update: 'bg-amber-500',
      Delete: 'bg-rose-500',
    }[a]);

    return {
      expandedId, totalPages, toggle, badgeClass, dotClass,
      formatTime: formatObserverTime, formatDate: formatObserverDate,
    };
  },
});
</script>
