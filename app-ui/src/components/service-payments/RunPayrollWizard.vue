<template>
  <div class="space-y-6">
    <!-- Date range -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
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
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="loadPreview"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Preview Payroll
          </button>
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-2">Pays every therapist owed money in this window at once. Date range defaults to the current quincena. Deselect a therapist to pay them next cycle.</p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Success summary -->
    <div v-if="result" class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-semibold text-green-900">
            Payroll run complete — {{ formatCurrency(result.totalPaid) }} across {{ result.therapistCount }} therapist{{ result.therapistCount !== 1 ? 's' : '' }}.
          </p>
          <div class="mt-3 flex gap-3">
            <router-link to="/statements" class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700">View Statements</router-link>
            <button class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50" @click="reset">New Run</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview table -->
    <template v-if="loaded && !result">
      <div v-if="preview.length === 0" class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p class="text-sm text-slate-500">No therapists are owed for this period.</p>
      </div>

      <div v-else class="bg-white rounded-lg shadow-sm border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-800">Therapists Owed</h3>
          <div class="flex items-center gap-3 text-sm">
            <button class="text-blue-600 hover:underline" @click="selectAll(true)">Select all</button>
            <button class="text-slate-500 hover:underline" @click="selectAll(false)">Clear</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 w-10"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapist</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount Owed</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              <tr v-for="t in preview" :key="t.therapistId" class="hover:bg-slate-50" :class="selected[t.therapistId] ? '' : 'opacity-50'">
                <td class="px-4 py-3">
                  <input type="checkbox" v-model="selected[t.therapistId]" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ t.therapistName }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">{{ t.sessionCount }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-slate-900">{{ formatCurrency(t.totalRemaining) }}</td>
              </tr>
              <tr class="bg-slate-50 font-medium">
                <td class="px-4 py-3" colspan="3">
                  <span class="text-sm text-slate-700">{{ selectedCount }} therapist{{ selectedCount !== 1 ? 's' : '' }} selected</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">{{ formatCurrency(grandTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Shared payment details -->
      <div v-if="preview.length > 0" class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 class="text-base font-semibold text-slate-800 mb-1">Payment Details</h3>
        <p class="text-xs text-slate-400 mb-4">Applied to the whole run. For a one-off exception, use the single-therapist "Pay Therapist" tab instead.</p>
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
            <input v-model="referenceNumber" type="text" placeholder="Optional" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input v-model="notes" type="text" placeholder="Optional" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div>
            <span class="text-sm text-slate-600">Total payroll</span>
            <span class="ml-2 text-2xl font-bold text-blue-700">{{ formatCurrency(grandTotal) }}</span>
          </div>
          <button
            :disabled="!canRun || submitting"
            class="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="run"
          >
            <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Run Payroll
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
import type { PayrollPreviewTherapist, BatchPayrollResult } from '../../interfaces/ServicePayment';

export default defineComponent({
  name: 'RunPayrollWizard',
  props: {
    paymentTypes: { type: Array as PropType<PaymentTypeInfo[]>, required: true },
  },
  emits: ['completed'],
  setup(props, { emit }) {
    const client = new ServicePaymentsHttpClient();

    const toIso = (d: Date) => d.toISOString().split('T')[0];
    const fromDate = ref(toIso(new Date()));
    const toDate = ref(toIso(new Date()));
    const paymentDate = ref(toIso(new Date()));
    const paymentTypeId = ref<number | null>(null);
    const referenceNumber = ref('');
    const notes = ref('');

    const preview = ref<PayrollPreviewTherapist[]>([]);
    const selected = reactive<Record<number, boolean>>({});
    const loaded = ref(false);
    const loading = ref(false);
    const submitting = ref(false);
    const error = ref('');
    const result = ref<BatchPayrollResult | null>(null);

    const selectedTherapists = computed(() => preview.value.filter((t) => selected[t.therapistId]));
    const selectedCount = computed(() => selectedTherapists.value.length);
    const grandTotal = computed(() => selectedTherapists.value.reduce((sum, t) => sum + t.totalRemaining, 0));
    const canRun = computed(() => selectedCount.value > 0 && !!paymentTypeId.value);

    const formatCurrency = (v: number) => `$${v.toFixed(2)}`;

    const selectAll = (value: boolean) => {
      preview.value.forEach((t) => { selected[t.therapistId] = value; });
    };

    const loadPreview = async () => {
      loading.value = true;
      error.value = '';
      result.value = null;
      try {
        const list = await client.getPayrollPreview(fromDate.value, toDate.value);
        preview.value = list;
        Object.keys(selected).forEach((k) => delete selected[Number(k)]);
        list.forEach((t) => { selected[t.therapistId] = true; });
        loaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load payroll preview.';
      } finally {
        loading.value = false;
      }
    };

    const run = async () => {
      if (!paymentTypeId.value) return;
      submitting.value = true;
      error.value = '';
      try {
        result.value = await client.runBatchPayroll({
          from: fromDate.value,
          to: toDate.value,
          paymentDate: paymentDate.value,
          paymentTypeId: paymentTypeId.value,
          referenceNumber: referenceNumber.value || null,
          notes: notes.value || null,
          therapistIds: selectedTherapists.value.map((t) => t.therapistId),
        });
        loaded.value = false;
        preview.value = [];
        emit('completed', result.value);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to run payroll.';
      } finally {
        submitting.value = false;
      }
    };

    const reset = () => {
      result.value = null;
      referenceNumber.value = '';
      notes.value = '';
    };

    onMounted(async () => {
      try {
        const window = await client.getQuincena();
        fromDate.value = window.from;
        toDate.value = window.to;
      } catch {
        // keep today/today if the helper is unreachable
      }
      if (props.paymentTypes.length > 0) {
        paymentTypeId.value = props.paymentTypes[0].paymentTypeId;
      }
    });

    return {
      fromDate, toDate, paymentDate, paymentTypeId, referenceNumber, notes,
      preview, selected, loaded, loading, submitting, error, result,
      selectedCount, grandTotal, canRun,
      formatCurrency, selectAll, loadPreview, run, reset,
    };
  },
});
</script>
