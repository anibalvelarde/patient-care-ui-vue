<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Therapist</label>
          <select
            v-model="selectedTherapistId"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null" disabled>Select a therapist...</option>
            <option v-for="t in therapists" :key="t.therapistId" :value="t.therapistId">{{ t.therapistName }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">From</label>
          <input v-model="fromDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">To</label>
          <input v-model="toDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <button
            :disabled="!selectedTherapistId || loading"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="load"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            View History
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <div v-if="loaded" class="bg-white rounded-lg shadow-sm border border-slate-200">
      <div v-if="payments.length === 0" class="p-8 text-center text-sm text-slate-500">
        No service payments recorded for this therapist in the selected period.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
              <th v-if="canAdjust" class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="p in payments" :key="p.servicePaymentId" class="hover:bg-slate-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(p.paymentDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium" :class="p.amount < 0 ? 'text-red-600' : 'text-slate-900'">
                {{ formatCurrency(p.amount) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ p.paymentType?.name || '—' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ p.referenceNumber || '—' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ p.allocations.length }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">
                <span
                  v-if="p.reversesServicePaymentId"
                  class="inline-flex items-center px-2 py-0.5 mr-2 rounded text-xs font-medium bg-amber-100 text-amber-800"
                >Reversal of #{{ p.reversesServicePaymentId }}</span>
                <span
                  v-else-if="p.isReversed"
                  class="inline-flex items-center px-2 py-0.5 mr-2 rounded text-xs font-medium bg-slate-200 text-slate-600"
                >Reversed</span>
                {{ p.notes || '—' }}
              </td>
              <td v-if="canAdjust" class="px-4 py-3 whitespace-nowrap text-sm text-right">
                <button
                  v-if="!p.isReversed && !p.reversesServicePaymentId"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                  @click="openReverse(p)"
                >
                  Reverse
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reverse confirmation modal -->
    <div v-if="reverseTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">Reverse payment #{{ reverseTarget.servicePaymentId }}</h3>
        <p class="text-sm text-slate-600">
          This writes an offsetting <span class="font-medium">{{ formatCurrency(-reverseTarget.amount) }}</span>
          entry; the original is kept for the audit trail and the
          {{ reverseTarget.allocations.length }} session(s) it covered become unpaid again. This cannot be undone —
          to re-pay, issue a new payment from the <span class="font-medium">Pay Therapist</span> tab.
        </p>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Reason <span class="text-red-600">*</span></label>
          <textarea
            v-model="reverseReason"
            rows="3"
            placeholder="e.g. Issued to the wrong therapist"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          ></textarea>
        </div>
        <div v-if="reverseError" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm text-red-700">{{ reverseError }}</p>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
            :disabled="reverseSubmitting"
            @click="cancelReverse"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="reverseSubmitting || !reverseReason.trim()"
            @click="confirmReverse"
          >
            {{ reverseSubmitting ? 'Reversing…' : 'Reverse payment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import { ServicePaymentsHttpClient } from '../../services/ServicePaymentsHttpClient';
import type { ServicePaymentRecord } from '../../interfaces/ServicePayment';
import { useClaims, Permissions } from '../../composables/useClaims';
import { formatCurrency } from '../../utils/formatCurrency';

interface TherapistOption {
  therapistId: number
  therapistName: string
}

export default defineComponent({
  name: 'ServicePaymentsList',
  props: {
    therapists: { type: Array as PropType<TherapistOption[]>, required: true },
  },
  setup() {
    const client = new ServicePaymentsHttpClient();
    const { hasClaim } = useClaims();
    const canAdjust = computed(() => hasClaim('Permission', Permissions.ServicePaymentsAdjust));

    const selectedTherapistId = ref<number | null>(null);
    const toIso = (d: Date) => d.toISOString().split('T')[0];
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const fromDate = ref(toIso(ninetyDaysAgo));
    const toDate = ref(toIso(today));

    const payments = ref<ServicePaymentRecord[]>([]);
    const loaded = ref(false);
    const loading = ref(false);
    const error = ref('');

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const load = async () => {
      if (!selectedTherapistId.value) return;
      loading.value = true;
      error.value = '';
      try {
        payments.value = await client.getServicePayments(selectedTherapistId.value, fromDate.value, toDate.value);
        loaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load service payments.';
      } finally {
        loading.value = false;
      }
    };

    // ---- Reversal ----
    const reverseTarget = ref<ServicePaymentRecord | null>(null);
    const reverseReason = ref('');
    const reverseError = ref('');
    const reverseSubmitting = ref(false);

    const openReverse = (p: ServicePaymentRecord) => {
      reverseTarget.value = p;
      reverseReason.value = '';
      reverseError.value = '';
    };

    const cancelReverse = () => {
      reverseTarget.value = null;
    };

    const confirmReverse = async () => {
      if (!reverseTarget.value || !reverseReason.value.trim()) return;
      reverseSubmitting.value = true;
      reverseError.value = '';
      try {
        await client.reverseServicePayment(reverseTarget.value.servicePaymentId, { reason: reverseReason.value.trim() });
        reverseTarget.value = null;
        await load();
      } catch (e: unknown) {
        reverseError.value = e instanceof Error ? e.message : 'Failed to reverse the payment.';
      } finally {
        reverseSubmitting.value = false;
      }
    };

    return {
      selectedTherapistId, fromDate, toDate, payments, loaded, loading, error,
      formatCurrency, formatDate, load, canAdjust,
      reverseTarget, reverseReason, reverseError, reverseSubmitting,
      openReverse, cancelReverse, confirmReverse,
    };
  },
});
</script>
