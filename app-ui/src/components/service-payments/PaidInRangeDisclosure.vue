<template>
  <!-- WP-20 — muted paid-in-range disclosure: chevron-toggle line + read-only paid table. -->
  <div>
    <button type="button" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600" @click="expanded = !expanded">
      <svg :class="['w-3.5 h-3.5 flex-shrink-0 transition-transform', expanded ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span>{{ lineText }}</span>
    </button>
    <div v-if="expanded" class="mt-2 mb-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 text-left">
      <table class="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapy Type</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Provider Amount</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Applied</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Ref</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="p in paid.sessions" :key="p.sessionId">
            <td class="px-4 py-2 whitespace-nowrap text-xs text-slate-600">{{ formatDate(p.sessionDate) }}</td>
            <td class="px-4 py-2 whitespace-nowrap text-xs text-slate-600">{{ p.patientName }}</td>
            <td class="px-4 py-2 whitespace-nowrap text-xs text-slate-600">{{ p.therapyType }}</td>
            <td class="px-4 py-2 whitespace-nowrap text-xs text-right text-slate-600">{{ formatCurrency(p.providerAmount) }}</td>
            <td class="px-4 py-2 whitespace-nowrap text-xs text-right text-slate-600">{{ formatCurrency(p.amountApplied) }}</td>
            <td class="px-4 py-2 whitespace-nowrap text-xs">
              <span
                v-if="p.remainingProviderAmount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
              >Partial</span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >Full</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-xs text-slate-500">{{ formatPaymentRefs(p.paymentReferences) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import type { PaidByPaymentRef, PaidInRangeSummary } from '../../interfaces/ServicePayment';
import { formatCurrency } from '../../utils/formatCurrency';

export default defineComponent({
  name: 'PaidInRangeDisclosure',
  props: {
    paid: { type: Object as PropType<PaidInRangeSummary>, required: true },
    /** The payable list is empty — lead with the empty-state copy ("No unpaid sessions in this range — …"). */
    allPaid: { type: Boolean, default: false },
  },
  setup(props) {
    const expanded = ref(false);
    // A fresh lookup (new envelope) collapses the detail again.
    watch(() => props.paid, () => { expanded.value = false; });

    // "N session(s) ($X) in this range were already paid", with a partial-applied suffix.
    const lineText = computed(() => {
      const p = props.paid;
      const n = p.fullyPaidSessionCount;
      const counted = `${n} session${n === 1 ? '' : 's'} (${formatCurrency(p.fullyPaidTotal)})`;
      const verb = n === 1 ? 'was' : 'were';
      let text = props.allPaid
        ? `No unpaid sessions in this range — ${counted} ${verb} already paid`
        : `${counted} in this range ${verb} already paid`;
      if (p.fullyPaidTotal !== p.totalApplied) {
        text += ` (incl. ${formatCurrency(p.totalApplied - p.fullyPaidTotal)} applied on partially-paid sessions shown above)`;
      }
      return text;
    });

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Compact "REF ($amt)" list; a blank reference falls back to the payment id as "#88".
    const formatPaymentRefs = (refs: PaidByPaymentRef[]) =>
      refs.map((r) => `${r.referenceNumber || `#${r.servicePaymentId}`} (${formatCurrency(r.amountApplied)})`).join(', ');

    return { expanded, lineText, formatCurrency, formatDate, formatPaymentRefs };
  },
});
</script>
