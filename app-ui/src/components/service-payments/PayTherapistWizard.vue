<template>
  <div class="space-y-6">
    <!-- Selection controls -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Therapist</label>
          <select
            v-model="selectedTherapistId"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            @click="loadSessions"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Find Unpaid Sessions
          </button>
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-2">Date range defaults to the current quincena (1st–15th or 16th–end of month). Override freely.</p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Success confirmation -->
    <div v-if="successRecord" class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-semibold text-green-900">
            Service payment of {{ formatCurrency(successRecord.amount) }} recorded for {{ successRecord.therapistName }}.
          </p>
          <p class="text-sm text-green-800 mt-1">
            {{ successRecord.allocations.length }} session{{ successRecord.allocations.length !== 1 ? 's' : '' }} paid.
            The therapist statement for this period is now authoritative.
          </p>
          <div class="mt-3 flex gap-3">
            <router-link to="/statements" class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              View Statement
            </router-link>
            <button class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50" @click="resetForNext">
              Record Another
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unpaid sessions + payment form -->
    <template v-if="loaded && !successRecord">
      <div v-if="sessions.length === 0" class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p class="text-sm text-slate-500">No unpaid completed sessions for this therapist in the selected period.</p>
      </div>

      <div v-else class="bg-white rounded-lg shadow-sm border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-800">Unpaid Sessions</h3>
          <div class="flex items-center gap-3 text-sm">
            <button class="text-blue-600 hover:underline" @click="selectAll(true)">Select all</button>
            <button class="text-slate-500 hover:underline" @click="selectAll(false)">Clear</button>
          </div>
        </div>
        <!-- WP-20 — paid-in-range disclosure -->
        <div v-if="paidInRange && paidInRange.totalApplied > 0" class="px-6 py-2 border-b border-slate-200">
          <button type="button" class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600" @click="paidExpanded = !paidExpanded">
            <svg :class="['w-3.5 h-3.5 flex-shrink-0 transition-transform', paidExpanded ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>{{ paidDisclosureText }}</span>
          </button>
          <div v-if="paidExpanded" class="mt-2 mb-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
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
                <tr v-for="p in paidInRange.sessions" :key="p.sessionId">
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
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 w-10"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapy Type</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Provider Amount</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              <tr v-for="s in sessions" :key="s.sessionId" class="hover:bg-slate-50" :class="selected[s.sessionId] ? '' : 'opacity-50'">
                <td class="px-4 py-3">
                  <input type="checkbox" v-model="selected[s.sessionId]" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(s.sessionDate) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ s.sessionTime }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ s.patientName }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ s.therapyType }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-slate-900">{{ formatCurrency(s.remainingProviderAmount) }}</td>
              </tr>
              <tr class="bg-slate-50 font-medium">
                <td class="px-4 py-3" colspan="5">
                  <span class="text-sm text-slate-700">{{ selectedCount }} session{{ selectedCount !== 1 ? 's' : '' }} selected</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">{{ formatCurrency(selectedTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment details -->
      <div v-if="sessions.length > 0" class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 class="text-base font-semibold text-slate-800 mb-4">Payment Details</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <input v-model="paymentDate" type="date" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select v-model="paymentTypeId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option :value="null" disabled>Select...</option>
              <option v-for="pt in paymentTypes" :key="pt.paymentTypeId" :value="pt.paymentTypeId">{{ pt.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Reference #</label>
            <input v-model="referenceNumber" type="text" placeholder="Check / transfer ref" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input v-model="notes" type="text" placeholder="Optional" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div>
            <span class="text-sm text-slate-600">Total to pay</span>
            <span class="ml-2 text-2xl font-bold text-blue-700">{{ formatCurrency(selectedTotal) }}</span>
          </div>
          <button
            :disabled="!canSubmit || submitting"
            class="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="submit"
          >
            <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Issue Payment
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, type PropType } from 'vue';
import { ServicePaymentsHttpClient } from '../../services/ServicePaymentsHttpClient';
import type { PaymentTypeInfo } from '../../interfaces/Payment';
import type { PaidByPaymentRef, PaidInRangeSummary, ServicePaymentRecord, UnpaidProviderSessionSummary } from '../../interfaces/ServicePayment';
import { toLocalYmd } from '../../utils/localDate';
import { formatCurrency } from '../../utils/formatCurrency';

interface TherapistOption {
  therapistId: number
  therapistName: string
}

export default defineComponent({
  name: 'PayTherapistWizard',
  props: {
    therapists: { type: Array as PropType<TherapistOption[]>, required: true },
    paymentTypes: { type: Array as PropType<PaymentTypeInfo[]>, required: true },
  },
  emits: ['created'],
  setup(props, { emit }) {
    const client = new ServicePaymentsHttpClient();

    const selectedTherapistId = ref<number | null>(null);
    const fromDate = ref(toLocalYmd(new Date()));
    const toDate = ref(toLocalYmd(new Date()));
    const paymentDate = ref(toLocalYmd(new Date()));
    const paymentTypeId = ref<number | null>(null);
    const referenceNumber = ref('');
    const notes = ref('');

    const sessions = ref<UnpaidProviderSessionSummary[]>([]);
    const paidInRange = ref<PaidInRangeSummary | null>(null);  // WP-20
    const paidExpanded = ref(false);
    const selected = reactive<Record<number, boolean>>({});
    const loaded = ref(false);
    const loading = ref(false);
    const submitting = ref(false);
    const error = ref('');
    const successRecord = ref<ServicePaymentRecord | null>(null);

    const selectedSessions = computed(() => sessions.value.filter((s) => selected[s.sessionId]));
    const selectedCount = computed(() => selectedSessions.value.length);
    const selectedTotal = computed(() => selectedSessions.value.reduce((sum, s) => sum + s.remainingProviderAmount, 0));
    const canSubmit = computed(() => !!selectedTherapistId.value && !!paymentTypeId.value && selectedTotal.value > 0);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // WP-20 — "N session(s) ($X) in this range were already paid", with a partial-applied suffix.
    const paidDisclosureText = computed(() => {
      const p = paidInRange.value;
      if (!p) return '';
      const n = p.fullyPaidSessionCount;
      let text = `${n} session${n === 1 ? '' : 's'} (${formatCurrency(p.fullyPaidTotal)}) in this range ${n === 1 ? 'was' : 'were'} already paid`;
      if (p.fullyPaidTotal !== p.totalApplied) {
        text += ` (incl. ${formatCurrency(p.totalApplied - p.fullyPaidTotal)} applied on partially-paid sessions shown above)`;
      }
      return text;
    });

    // Compact "REF ($amt)" list; a blank reference falls back to the payment id as "#88".
    const formatPaymentRefs = (refs: PaidByPaymentRef[]) =>
      refs.map((r) => `${r.referenceNumber || `#${r.servicePaymentId}`} (${formatCurrency(r.amountApplied)})`).join(', ');

    const selectAll = (value: boolean) => {
      sessions.value.forEach((s) => { selected[s.sessionId] = value; });
    };

    const loadSessions = async () => {
      if (!selectedTherapistId.value) return;
      loading.value = true;
      error.value = '';
      successRecord.value = null;
      try {
        const result = await client.getUnpaidSessions(selectedTherapistId.value, fromDate.value, toDate.value);
        sessions.value = result.sessions;
        paidInRange.value = result.paidInRange;
        paidExpanded.value = false;
        Object.keys(selected).forEach((k) => delete selected[Number(k)]);
        result.sessions.forEach((s) => { selected[s.sessionId] = true; });
        loaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load unpaid sessions.';
      } finally {
        loading.value = false;
      }
    };

    const submit = async () => {
      if (!selectedTherapistId.value || !paymentTypeId.value) return;
      submitting.value = true;
      error.value = '';
      try {
        const record = await client.createServicePayment({
          therapistId: selectedTherapistId.value,
          paymentDate: paymentDate.value,
          amount: selectedTotal.value,
          paymentTypeId: paymentTypeId.value,
          referenceNumber: referenceNumber.value || null,
          notes: notes.value || null,
          sessionAllocations: selectedSessions.value.map((s) => ({
            sessionId: s.sessionId,
            amountApplied: s.remainingProviderAmount,
          })),
        });
        successRecord.value = record;
        loaded.value = false;
        sessions.value = [];
        paidInRange.value = null;
        paidExpanded.value = false;
        emit('created', record);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to issue payment.';
      } finally {
        submitting.value = false;
      }
    };

    const resetForNext = () => {
      successRecord.value = null;
      referenceNumber.value = '';
      notes.value = '';
    };

    onMounted(async () => {
      // Default the date range to the current quincena, and pre-select a payment method.
      try {
        const window = await client.getQuincena();
        fromDate.value = window.from;
        toDate.value = window.to;
      } catch {
        // Non-fatal: keep today/today defaults if the helper is unreachable.
      }
      if (props.paymentTypes.length > 0) {
        paymentTypeId.value = props.paymentTypes[0].paymentTypeId;
      }
    });

    return {
      selectedTherapistId, fromDate, toDate, paymentDate, paymentTypeId, referenceNumber, notes,
      sessions, paidInRange, paidExpanded, selected, loaded, loading, submitting, error, successRecord,
      selectedCount, selectedTotal, canSubmit, paidDisclosureText,
      formatCurrency, formatDate, formatPaymentRefs, selectAll, loadSessions, submit, resetForNext,
    };
  },
});
</script>
