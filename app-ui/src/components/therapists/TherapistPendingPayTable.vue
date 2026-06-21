<template>
  <div>
    <!-- Desktop table -->
    <div class="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-sky-50 border-b border-sky-200">
            <th class="px-4 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Therapist</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">Sessions</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-sky-700 uppercase tracking-wider">Session Dates</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">Patients</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">Clinic Made</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">Owed</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-sky-700 uppercase tracking-wider">% Owed</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="row in filteredRows" :key="row.therapistId" class="hover:bg-sky-50/50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ row.therapistName }}</td>
            <td class="px-4 py-3 text-sm text-right text-slate-600">{{ row.sessionCount }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(row.firstSessionDate) }} – {{ formatDate(row.lastSessionDate) }}</td>
            <td class="px-4 py-3 text-sm text-right text-slate-600">{{ row.distinctPatientCount }}</td>
            <td class="px-4 py-3 text-sm text-right text-slate-600">{{ formatCurrency(row.grossBilled) }}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold text-sky-700">{{ formatCurrency(row.amountOwed) }}</td>
            <td class="px-4 py-3 text-sm text-right text-slate-600">{{ row.owedPctOfGross.toFixed(1) }}%</td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="7" class="px-4 py-12 text-center text-sm text-slate-400">
              No therapists are currently owed.
            </td>
          </tr>
        </tbody>
        <tfoot v-if="filteredRows.length > 0">
          <tr class="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-800">
            <td class="px-4 py-3 text-sm">{{ filteredRows.length }} therapist{{ filteredRows.length !== 1 ? 's' : '' }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ totals.sessions }}</td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3"></td>
            <td class="px-4 py-3 text-sm text-right">{{ formatCurrency(totals.gross) }}</td>
            <td class="px-4 py-3 text-sm text-right text-sky-700">{{ formatCurrency(totals.owed) }}</td>
            <td class="px-4 py-3 text-sm text-right">{{ totals.pct.toFixed(1) }}%</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-3">
      <div
        v-for="row in filteredRows"
        :key="row.therapistId"
        class="bg-white rounded-xl border border-slate-200 p-4"
      >
        <div class="flex items-start justify-between mb-2">
          <p class="text-sm font-semibold text-slate-800">{{ row.therapistName }}</p>
          <span class="text-sm font-semibold text-sky-700">{{ formatCurrency(row.amountOwed) }} owed</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div><span class="font-medium">Sessions:</span> {{ row.sessionCount }}</div>
          <div><span class="font-medium">Patients:</span> {{ row.distinctPatientCount }}</div>
          <div class="col-span-2"><span class="font-medium">Dates:</span> {{ formatDate(row.firstSessionDate) }} – {{ formatDate(row.lastSessionDate) }}</div>
          <div><span class="font-medium">Clinic made:</span> {{ formatCurrency(row.grossBilled) }}</div>
          <div><span class="font-medium">% owed:</span> {{ row.owedPctOfGross.toFixed(1) }}%</div>
        </div>
      </div>
      <div v-if="filteredRows.length === 0" class="text-center py-12 text-sm text-slate-400">
        No therapists are currently owed.
      </div>
      <div v-else class="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs font-semibold text-slate-700">
        Total: {{ totals.sessions }} sessions · made {{ formatCurrency(totals.gross) }} · owed
        <span class="text-sky-700">{{ formatCurrency(totals.owed) }}</span> ({{ totals.pct.toFixed(1) }}%)
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import type { PendingPayReport } from '../../interfaces/ServicePayment';
import { formatCurrency } from '../../utils/formatCurrency';

export default defineComponent({
  name: 'TherapistPendingPayTable',
  props: {
    report: { type: Object as PropType<PendingPayReport | null>, default: null },
    search: { type: String, default: '' },
  },
  setup(props) {
    const filteredRows = computed(() => {
      const rows = props.report?.rows ?? [];
      const q = props.search.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter((r) => r.therapistName.toLowerCase().includes(q));
    });

    // Totals follow the visible rows so they stay consistent under search.
    const totals = computed(() => {
      const sessions = filteredRows.value.reduce((s, r) => s + r.sessionCount, 0);
      const gross = filteredRows.value.reduce((s, r) => s + r.grossBilled, 0);
      const owed = filteredRows.value.reduce((s, r) => s + r.amountOwed, 0);
      return { sessions, gross, owed, pct: gross > 0 ? (owed / gross) * 100 : 0 };
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return { filteredRows, totals, formatCurrency, formatDate };
  },
});
</script>
