<template>
  <!-- Desktop table -->
  <div class="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="bg-amber-50 border-b border-amber-200">
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider w-8"></th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Patient</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Past-Due Sessions</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Due</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Paid So Far</th>
          <th class="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Balance</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <template v-for="dp in filteredPatients" :key="dp.party.id">
          <!-- Summary row -->
          <tr
            class="hover:bg-amber-50/50 transition-colors cursor-pointer"
            @click="toggleExpand(dp.party.id)"
          >
            <td class="px-4 py-3 text-sm text-slate-400">
              <svg
                :class="['w-4 h-4 transition-transform', expanded.has(dp.party.id) ? 'rotate-90' : '']"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </td>
            <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ dp.party.name }}</td>
            <td class="px-4 py-3 text-sm">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {{ dp.pastDueSessions }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm font-medium text-amber-700">${{ dp.pastDueTotalAmount.toFixed(2) }}</td>
            <td class="px-4 py-3 text-sm text-slate-600">${{ dp.amountPaidSoFar.toFixed(2) }}</td>
            <td class="px-4 py-3 text-sm font-semibold text-red-600">
              <div class="flex items-center justify-between">
                <span>${{ (dp.pastDueTotalAmount - dp.amountPaidSoFar).toFixed(2) }}</span>
                <button
                  class="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  title="Record payment for this patient"
                  @click.stop="$emit('pay', dp)"
                >
                  Record Payment
                </button>
              </div>
            </td>
          </tr>
          <!-- Expanded session detail rows -->
          <template v-if="expanded.has(dp.party.id)">
            <tr
              v-for="session in dp.delinquency"
              :key="session.sessionId"
              class="bg-amber-50/30"
            >
              <td class="px-4 py-2"></td>
              <td colspan="5" class="px-4 py-2">
                <router-link
                  :to="{ path: '/', query: { date: session.sessionDate, highlightSession: String(session.sessionId) } }"
                  class="flex items-center justify-between group hover:bg-amber-100/50 rounded-lg px-3 py-2 -mx-3 transition-colors"
                >
                  <div class="flex items-center space-x-4">
                    <span class="text-xs text-slate-400 w-20">{{ formatDate(session.sessionDate) }}</span>
                    <span class="text-xs text-slate-600">{{ session.therapist }}</span>
                    <span class="text-xs text-slate-400">{{ session.therapyTypes }}</span>
                  </div>
                  <div class="flex items-center space-x-4">
                    <span class="text-xs text-slate-500">${{ session.amount.toFixed(2) }}</span>
                    <span v-if="session.discount > 0" class="text-xs text-green-600">-${{ session.discount.toFixed(2) }}</span>
                    <span class="text-xs font-medium text-amber-700">${{ session.amountDue.toFixed(2) }} due</span>
                    <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </router-link>
              </td>
            </tr>
          </template>
        </template>
        <tr v-if="filteredPatients.length === 0">
          <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400">
            No delinquent patients found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile cards -->
  <div class="md:hidden space-y-3">
    <div
      v-for="dp in filteredPatients"
      :key="dp.party.id"
      class="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <!-- Summary card header -->
      <div
        class="p-4 cursor-pointer"
        @click="toggleExpand(dp.party.id)"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-2">
            <svg
              :class="['w-4 h-4 text-slate-400 transition-transform', expanded.has(dp.party.id) ? 'rotate-90' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <p class="text-sm font-semibold text-slate-800">{{ dp.party.name }}</p>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            {{ dp.pastDueSessions }} past due
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs text-slate-500">
          <div><span class="font-medium">Total Due:</span> ${{ dp.pastDueTotalAmount.toFixed(2) }}</div>
          <div><span class="font-medium">Paid:</span> ${{ dp.amountPaidSoFar.toFixed(2) }}</div>
          <div><span class="font-medium text-red-600">Balance:</span> <span class="text-red-600">${{ (dp.pastDueTotalAmount - dp.amountPaidSoFar).toFixed(2) }}</span></div>
        </div>
      </div>

      <!-- Expanded sessions -->
      <div v-if="expanded.has(dp.party.id)" class="border-t border-slate-100 divide-y divide-slate-50">
        <router-link
          v-for="session in dp.delinquency"
          :key="session.sessionId"
          :to="{ path: '/', query: { date: session.sessionDate, highlightSession: String(session.sessionId) } }"
          class="block px-4 py-3 bg-amber-50/30 hover:bg-amber-100/50 transition-colors"
        >
          <div class="flex items-center justify-between text-xs">
            <div class="space-x-2">
              <span class="text-slate-500">{{ formatDate(session.sessionDate) }}</span>
              <span class="text-slate-600">{{ session.therapist }}</span>
              <span class="text-slate-400">{{ session.therapyTypes }}</span>
            </div>
            <span class="font-medium text-amber-700">${{ session.amountDue.toFixed(2) }}</span>
          </div>
        </router-link>
      </div>
    </div>
    <div v-if="filteredPatients.length === 0" class="text-center py-12 text-sm text-slate-400">
      No delinquent patients found.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { DelinquentPatient } from '../../interfaces/Delinquency';

export default defineComponent({
  name: 'DelinquentTable',
  props: {
    patients: { type: Array as PropType<DelinquentPatient[]>, required: true },
    search: { type: String, default: '' },
  },
  emits: ['pay'],
  setup(props) {
    const expanded = ref<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
      const next = new Set(expanded.value);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      expanded.value = next;
    };

    const filteredPatients = computed(() => {
      const q = props.search.trim().toLowerCase();
      if (!q) return props.patients;
      return props.patients.filter((dp) =>
        dp.party.name.toLowerCase().includes(q)
      );
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return { expanded, toggleExpand, filteredPatients, formatDate };
  },
});
</script>
