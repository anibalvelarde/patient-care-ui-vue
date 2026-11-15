<template>
  <!-- WP-64: price-sheet audit — specialties that have durations with no price and no default.
       Those combinations can't be booked or put on a treatment plan (WP-61 no-price block). -->
  <div class="bg-white rounded-xl shadow-sm border border-slate-200" data-testid="price-gaps-panel">
    <div class="px-6 py-4 border-b border-slate-200">
      <h2 class="text-lg font-semibold text-slate-800">Price gaps</h2>
      <p class="text-sm text-slate-500">
        Specialties with a duration that has no price and no default price. Those can't be booked or
        added to a treatment plan until a price is set.
      </p>
    </div>

    <div v-if="loading" class="px-6 py-12 text-center">
      <p class="text-sm text-slate-500">Loading...</p>
    </div>

    <div v-else-if="gaps.length === 0" class="px-6 py-12 text-center" data-testid="price-gaps-empty">
      <p class="text-sm text-emerald-700">No gaps — every specialty has a price at every duration.</p>
    </div>

    <table v-else class="w-full">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50">
          <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialty</th>
          <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">No price at</th>
          <th class="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="gap in gaps" :key="gap.specialty.id" data-testid="price-gap-row">
          <td class="px-6 py-3 text-sm">
            <span class="font-medium text-slate-800">{{ gap.specialty.abbreviation }}</span>
            <span class="text-slate-500"> — {{ gap.specialty.name }}</span>
          </td>
          <td class="px-6 py-3">
            <span
              v-for="d in gap.missingDurations"
              :key="d"
              class="inline-flex items-center px-2 py-0.5 mr-1 mb-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
              data-testid="price-gap-duration"
            >
              {{ d }} min
            </span>
          </td>
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <button
              v-if="canEditPrices"
              class="text-sm font-medium text-violet-600 hover:text-violet-700"
              data-testid="price-gap-set-prices"
              @click="$emit('prices', gap.specialty)"
            >
              Set prices
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import type { LookupItem } from '../../interfaces/Lookups';
import { findPriceGaps } from '../../utils/linePrice';

export default defineComponent({
  name: 'SpecialtyPriceGapsPanel',
  props: {
    items: { type: Array as PropType<LookupItem[]>, required: true },
    loading: { type: Boolean, default: false },
    canEditPrices: { type: Boolean, default: false },
  },
  emits: ['prices'],
  setup(props) {
    const gaps = computed(() => findPriceGaps(props.items));
    return { gaps };
  },
});
</script>
