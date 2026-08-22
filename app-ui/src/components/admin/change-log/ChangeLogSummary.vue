<template>
  <div v-if="summary" class="space-y-6">
    <!-- KPI tiles -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="changelog-tiles">
      <div v-for="tile in tiles" :key="tile.label" class="bg-white rounded-xl border px-4 py-3" :class="tile.border">
        <p class="text-2xl font-bold text-gray-800" :data-testid="`stat-${tile.key}`">{{ tile.value }}</p>
        <p class="text-xs text-gray-400">{{ tile.label }}</p>
      </div>
    </div>

    <!-- (1) by user — LEAD lens -->
    <section>
      <div class="flex items-center gap-2 mb-2">
        <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Activity by user</h3>
        <span class="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">LEAD VIEW</span>
        <span class="text-xs text-slate-400">where the work is going — click a person to drill in</span>
      </div>
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <th class="py-2 pr-4">User</th>
            <th class="py-2 pr-4 text-right">Inserts</th>
            <th class="py-2 pr-4 text-right">Updates</th>
            <th class="py-2 pr-4 text-right">Deletes</th>
            <th class="py-2 pr-4 text-right">Total</th>
            <th class="py-2 pr-4">Last change</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="summary.byUser.length === 0"><td colspan="6" class="py-6 text-center text-slate-400">No activity in this window.</td></tr>
          <tr
            v-for="u in summary.byUser"
            :key="u.userId"
            class="border-b border-slate-100 hover:bg-violet-50/40 cursor-pointer"
            data-testid="changelog-byuser-row"
            @click="$emit('filter-user', u.userId)"
          >
            <td class="py-2.5 pr-4 font-medium text-slate-800">{{ u.displayName }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ u.inserts }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ u.updates }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ u.deletes }}</td>
            <td class="py-2.5 pr-4 text-right font-bold text-slate-800 tabular-nums">{{ u.total }}</td>
            <td class="py-2.5 pr-4 text-slate-400 text-xs">{{ formatDateTime(u.lastOccurredAtUtc) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- (2) by entity type -->
    <section>
      <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
        Activity by record type <span class="font-normal text-slate-400 normal-case">— click to filter the detail below</span>
      </h3>
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <th class="py-2 pr-4">Record type</th>
            <th class="py-2 pr-4 text-right">Inserts</th>
            <th class="py-2 pr-4 text-right">Updates</th>
            <th class="py-2 pr-4 text-right">Deletes</th>
            <th class="py-2 pr-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="summary.byEntityType.length === 0"><td colspan="5" class="py-6 text-center text-slate-400">No activity.</td></tr>
          <tr
            v-for="t in summary.byEntityType"
            :key="t.entityType"
            class="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer"
            data-testid="changelog-byentity-row"
            @click="$emit('filter-entity', t.entityType)"
          >
            <td class="py-2.5 pr-4 font-semibold text-slate-700">{{ t.entityType }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ t.inserts }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ t.updates }}</td>
            <td class="py-2.5 pr-4 text-right tabular-nums">{{ t.deletes }}</td>
            <td class="py-2.5 pr-4 text-right font-bold text-slate-800 tabular-nums">{{ t.total }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- (3) period trend -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Trend <span class="font-normal text-slate-400 normal-case">— your local time</span></h3>
        <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          <button
            v-for="g in groups"
            :key="g"
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors"
            :class="summary.groupBy === g ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            :data-testid="`groupby-${g}`"
            @click="$emit('change-group', g)"
          >
            {{ g }}
          </button>
        </div>
      </div>
      <p v-if="summary.byPeriodOmitted" class="text-sm text-slate-400" data-testid="changelog-trend-omitted">
        Too many buckets to chart at this granularity — narrow the window or pick a larger period.
      </p>
      <div v-else class="flex items-end gap-2 h-32" data-testid="changelog-trend">
        <div v-for="p in summary.byPeriod" :key="p.periodStart" class="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          <div class="w-full max-w-[48px] rounded-t bg-gradient-to-t from-violet-600 to-violet-400" :style="{ height: barHeight(p.total) }" :title="`${p.label}: ${p.total}`"></div>
          <span class="text-[10px] text-slate-400">{{ p.label }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import type { ChangeLogSummary, ChangeLogGroupBy } from '../../../interfaces/ChangeLog';
import { formatObserverDateTime } from '../../../utils/observerTime';

export default defineComponent({
  name: 'ChangeLogSummary',
  props: {
    summary: { type: Object as PropType<ChangeLogSummary | null>, default: null },
  },
  emits: ['filter-user', 'filter-entity', 'change-group'],
  setup(props) {
    const groups: ChangeLogGroupBy[] = ['day', 'week', 'month', 'quarter', 'year'];

    const tiles = computed(() => {
      const t = props.summary?.totals;
      return [
        { key: 'total', label: 'Total changes', value: t?.total ?? 0, border: 'border-violet-200' },
        { key: 'inserts', label: 'Inserts', value: t?.inserts ?? 0, border: 'border-emerald-200' },
        { key: 'updates', label: 'Updates', value: t?.updates ?? 0, border: 'border-amber-200' },
        { key: 'deletes', label: 'Deletes', value: t?.deletes ?? 0, border: 'border-rose-200' },
        { key: 'users', label: 'Active users', value: t?.distinctUsers ?? 0, border: 'border-sky-200' },
      ];
    });

    const maxTotal = computed(() =>
      Math.max(1, ...(props.summary?.byPeriod.map((p) => p.total) ?? [1])));

    const barHeight = (total: number): string => `${Math.max(2, Math.round((total / maxTotal.value) * 100))}%`;

    return { groups, tiles, barHeight, formatDateTime: formatObserverDateTime };
  },
});
</script>
