<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-lg bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isEdit ? 'Edit Payment' : 'Record Payment' }}
          </h2>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Step indicator -->
        <div class="px-6 py-3 border-b border-slate-100 flex items-center space-x-4 text-sm">
          <span :class="step === 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'">1. Payment Details</span>
          <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span :class="step === 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'">2. Allocate to Sessions</span>
        </div>

        <!-- Step 1: Payment Details -->
        <div v-if="step === 1" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Caretaker *</label>
            <select
              v-model="form.caretakerId"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="onCaretakerChange"
            >
              <option :value="0" disabled>Select a caretaker...</option>
              <option v-for="ct in caretakers" :key="ct.caretakerId" :value="ct.caretakerId">
                {{ ct.caretakerName }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                <input
                  v-model.number="form.amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  class="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                v-model="form.paymentDate"
                type="date"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Payment Type *</label>
            <select
              v-model="form.paymentTypeId"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option :value="0" disabled>Select type...</option>
              <option v-for="pt in paymentTypes" :key="pt.paymentTypeId" :value="pt.paymentTypeId">
                {{ pt.name }} ({{ pt.abbreviation }})
              </option>
            </select>
          </div>

          <div v-if="isCheckType">
            <label class="block text-sm font-medium text-slate-700 mb-1">Check Number</label>
            <input
              v-model="form.checkNumber"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

        </div>

        <!-- Step 2: Session Allocation -->
        <div v-if="step === 2" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <!-- Summary bar -->
          <div :class="isFullyAllocated ? 'bg-green-50' : isOverAllocated ? 'bg-red-50' : 'bg-blue-50'" class="rounded-lg p-3 text-sm">
            <div class="flex items-center justify-between">
              <span :class="isFullyAllocated ? 'text-green-800' : isOverAllocated ? 'text-red-800' : 'text-blue-800'">Payment: <strong>{{ formatCurrency(form.amount) }}</strong></span>
              <span :class="isFullyAllocated ? 'text-green-800' : isOverAllocated ? 'text-red-800' : 'text-blue-800'">Allocated: <strong>{{ formatCurrency(totalAllocated) }}</strong></span>
              <span v-if="isFullyAllocated" class="text-green-700 font-medium flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                Fully Allocated
              </span>
              <span v-else :class="remaining < 0 ? 'text-red-600' : 'text-amber-600'">
                Remaining: <strong>{{ formatCurrency(remaining) }}</strong>
              </span>
            </div>
            <div v-if="isOverAllocated" class="mt-2 flex items-start space-x-2 text-red-700">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="text-xs">You have overallocated by <strong>{{ formatCurrency(Math.abs(remaining)) }}</strong>. Reduce allocations on one or more sessions to match the payment amount.</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-slate-700">Unpaid Sessions</h3>
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 font-medium"
              @click="autoAllocateOldest"
            >
              Auto-allocate oldest first
            </button>
          </div>

          <div v-if="loadingSessions" class="text-center text-sm text-slate-400 py-4">
            Loading sessions...
          </div>

          <div v-else-if="unpaidSessions.length === 0" class="text-center text-sm text-slate-400 py-4">
            No unpaid sessions found for this caretaker's patients.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="session in unpaidSessions"
              :key="session.sessionId"
              class="border border-slate-200 rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <div>
                  <span class="text-sm font-medium text-slate-800">{{ session.patientName }}</span>
                  <span class="text-xs text-slate-400 ml-2">{{ session.sessionDate }}</span>
                  <span v-if="session.isPastDue" class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Past Due</span>
                </div>
                <span class="text-sm text-slate-600">Due: {{ formatCurrency(session.amountDue) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-slate-400">Therapist: {{ session.therapistName }}</span>
                <div class="flex-1"></div>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="isFullAllocation(session.sessionId, session.amountDue)"
                    class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    @change="toggleFullAllocation(session.sessionId, session.amountDue, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-xs text-slate-500">Full</span>
                </label>
                <label class="text-xs text-slate-500">Allocate:</label>
                <div class="relative w-28">
                  <span class="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-xs">$</span>
                  <input
                    :value="getAllocation(session.sessionId)"
                    type="number"
                    step="0.01"
                    min="0"
                    :max="session.amountDue"
                    class="w-full rounded border border-slate-300 pl-5 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    @input="setAllocation(session.sessionId, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error }}
          </div>
          <div class="flex items-center justify-between">
          <div>
            <button
              v-if="step === 2"
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="step = 1"
            >
              Back
            </button>
          </div>
          <div class="flex items-center space-x-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              v-if="step === 1"
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              @click="goToStep2"
            >
              Next
            </button>
            <button
              v-if="step === 2"
              type="button"
              :disabled="saving || !isFullyAllocated || !!error"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              :title="!isFullyAllocated ? 'Payment must be fully allocated before saving' : ''"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save Payment' }}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch, type PropType } from 'vue';
import type { PaymentRecord, PaymentTypeInfo, UnpaidSessionSummary, SessionAllocationItem } from '../../interfaces/Payment';
import type { Caretaker } from '../../interfaces/Caretaker';
import { PaymentsHttpClient } from '../../services/PaymentsHttpClient';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';

export default defineComponent({
  name: 'PaymentFormModal',
  props: {
    visible: { type: Boolean, required: true },
    payment: { type: Object as PropType<PaymentRecord | null>, default: null },
    preSelectedCaretakerId: { type: Number, default: 0 },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const paymentsClient = new PaymentsHttpClient();
    const caretakersClient = new CaretakersHttpClient();

    const step = ref(1);
    const saving = ref(false);
    const error = ref('');
    const loadingSessions = ref(false);

    const caretakers = ref<Caretaker[]>([]);
    const paymentTypes = ref<PaymentTypeInfo[]>([]);
    const unpaidSessions = ref<UnpaidSessionSummary[]>([]);
    const allocations = reactive<Record<number, number>>({});

    const form = reactive({
      caretakerId: 0,
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentTypeId: 0,
      checkNumber: '',
    });

    const isEdit = ref(false);

    const isCheckType = computed(() => {
      const pt = paymentTypes.value.find((t) => t.paymentTypeId === form.paymentTypeId);
      return pt?.abbreviation === 'CHK';
    });

    const totalAllocated = computed(() =>
      Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0)
    );

    const remaining = computed(() => form.amount - totalAllocated.value);

    const isFullyAllocated = computed(() =>
      form.amount > 0 && Math.abs(totalAllocated.value - form.amount) < 0.005
    );

    const isOverAllocated = computed(() =>
      totalAllocated.value > form.amount + 0.005
    );

    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

    const getAllocation = (sessionId: number): number => allocations[sessionId] || 0;

    const setAllocation = (sessionId: number, value: string) => {
      const num = parseFloat(value) || 0;
      allocations[sessionId] = num;
    };

    const isFullAllocation = (sessionId: number, amountDue: number): boolean => {
      return Math.abs((allocations[sessionId] || 0) - amountDue) < 0.005 && amountDue > 0;
    };

    const toggleFullAllocation = (sessionId: number, amountDue: number, checked: boolean) => {
      allocations[sessionId] = checked ? parseFloat(amountDue.toFixed(2)) : 0;
    };

    const autoAllocateOldest = () => {
      // Clear existing allocations
      for (const key of Object.keys(allocations)) {
        allocations[parseInt(key)] = 0;
      }

      let remainingAmount = form.amount;
      for (const session of unpaidSessions.value) {
        if (remainingAmount <= 0) break;
        const allocAmount = Math.min(remainingAmount, session.amountDue);
        allocations[session.sessionId] = parseFloat(allocAmount.toFixed(2));
        remainingAmount -= allocAmount;
      }
    };

    const loadReferenceData = async () => {
      try {
        const [cts, pts] = await Promise.all([
          caretakersClient.getCaretakers(),
          paymentsClient.getPaymentTypes(),
        ]);
        caretakers.value = cts.sort((a, b) => a.caretakerName.localeCompare(b.caretakerName));
        paymentTypes.value = pts;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load reference data.';
      }
    };

    const loadUnpaidSessions = async () => {
      if (!form.caretakerId) return;
      loadingSessions.value = true;
      try {
        unpaidSessions.value = await paymentsClient.getUnpaidSessions(form.caretakerId);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load unpaid sessions.';
      } finally {
        loadingSessions.value = false;
      }
    };

    const onCaretakerChange = () => {
      // Clear allocations when caretaker changes
      for (const key of Object.keys(allocations)) {
        delete allocations[parseInt(key)];
      }
      unpaidSessions.value = [];
    };

    const goToStep2 = () => {
      error.value = '';
      if (!form.caretakerId) {
        error.value = 'Please select a caretaker.';
        return;
      }
      if (form.amount <= 0) {
        error.value = 'Amount must be greater than zero.';
        return;
      }
      if (!form.paymentTypeId) {
        error.value = 'Please select a payment type.';
        return;
      }
      step.value = 2;
      loadUnpaidSessions();
    };

    const handleSubmit = async () => {
      error.value = '';

      if (!isFullyAllocated.value) {
        error.value = `Payment must be fully allocated. Allocated: $${totalAllocated.value.toFixed(2)}, Payment: $${form.amount.toFixed(2)}.`;
        return;
      }

      const sessionAllocations: SessionAllocationItem[] = Object.entries(allocations)
        .filter(([, amount]) => amount > 0)
        .map(([sessionId, amount]) => ({
          sessionId: parseInt(sessionId),
          amountAllocated: amount,
        }));

      saving.value = true;
      try {
        const requestData = {
          amount: form.amount,
          paymentDate: new Date(form.paymentDate).toISOString(),
          caretakerId: form.caretakerId,
          paymentTypeId: form.paymentTypeId,
          checkNumber: form.checkNumber || null,
          sessionAllocations,
        };

        if (isEdit.value && props.payment) {
          await paymentsClient.updatePayment(props.payment.paymentId, requestData);
        } else {
          await paymentsClient.createPayment(requestData);
        }
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'An error occurred while saving.';
      } finally {
        saving.value = false;
      }
    };

    watch(form, () => { error.value = ''; }, { deep: true });

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        error.value = '';
        step.value = 1;

        // Clear allocations
        for (const key of Object.keys(allocations)) {
          delete allocations[parseInt(key)];
        }

        if (props.payment) {
          isEdit.value = true;
          form.caretakerId = props.payment.caretakerId;
          form.amount = props.payment.amount;
          form.paymentDate = props.payment.paymentDate.split('T')[0];
          form.paymentTypeId = props.payment.paymentType.paymentTypeId;
          form.checkNumber = props.payment.checkNumber || '';
          // Pre-populate allocations from existing
          for (const alloc of props.payment.allocations) {
            allocations[alloc.sessionId] = alloc.amountAllocated;
          }
        } else {
          isEdit.value = false;
          form.caretakerId = props.preSelectedCaretakerId || 0;
          form.amount = 0;
          form.paymentDate = new Date().toISOString().split('T')[0];
          form.paymentTypeId = 0;
          form.checkNumber = '';
        }

        loadReferenceData();
      }
    );

    return {
      step,
      saving,
      error,
      loadingSessions,
      caretakers,
      paymentTypes,
      unpaidSessions,
      allocations,
      form,
      isEdit,
      isCheckType,
      totalAllocated,
      remaining,
      isFullyAllocated,
      isOverAllocated,
      formatCurrency,
      getAllocation,
      setAllocation,
      isFullAllocation,
      toggleFullAllocation,
      autoAllocateOldest,
      onCaretakerChange,
      goToStep2,
      handleSubmit,
    };
  },
});
</script>
