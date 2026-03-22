<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">Payment Details</h2>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Session info -->
        <div v-if="session" class="px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Patient</span>
            <span class="font-medium text-slate-800">{{ session.patient }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Date</span>
            <span class="text-slate-700">{{ session.sessionDate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Therapist</span>
            <span class="text-slate-700">{{ session.therapist }}</span>
          </div>
          <div class="flex justify-between pt-1 border-t border-slate-200">
            <span class="text-slate-500">Billed</span>
            <span class="text-slate-700">{{ formatCurrency(session.amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Paid</span>
            <span class="text-green-600 font-medium">{{ formatCurrency(session.amountPaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Due</span>
            <span :class="session.amountDue > 0 ? 'text-red-600 font-medium' : 'text-slate-700'">{{ formatCurrency(session.amountDue) }}</span>
          </div>
        </div>

        <!-- Payment list -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="loading" class="text-center text-sm text-slate-400 py-8">
            Loading payment details...
          </div>

          <div v-else-if="payments.length === 0" class="text-center text-sm text-slate-400 py-8">
            No payments recorded for this session.
          </div>

          <div v-else class="space-y-3">
            <h3 class="text-sm font-medium text-slate-700 mb-2">Payments Applied</h3>
            <div
              v-for="pmt in payments"
              :key="pmt.sessionPaymentId"
              class="border border-slate-200 rounded-lg p-3 space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-800">{{ formatCurrency(pmt.amountAllocated) }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                  {{ pmt.paymentType.abbreviation }}
                </span>
              </div>
              <div class="text-xs text-slate-500">
                {{ formatDate(pmt.paymentDate) }} &mdash; {{ pmt.caretakerName }}
              </div>
              <div v-if="pmt.checkNumber" class="text-xs text-slate-400">
                Check #{{ pmt.checkNumber }}
              </div>
              <div class="text-xs text-slate-400">
                From payment of {{ formatCurrency(pmt.paymentTotalAmount) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, watch, type PropType } from 'vue';
import type { SessionPaymentDetail } from '../../interfaces/Payment';
import type { Appointment } from '../../interfaces/Appointment';
import { PaymentsHttpClient } from '../../services/PaymentsHttpClient';

export default defineComponent({
  name: 'SessionPaymentsModal',
  props: {
    visible: { type: Boolean, required: true },
    session: { type: Object as PropType<Appointment | null>, default: null },
  },
  emits: ['close'],
  setup(props) {
    const client = new PaymentsHttpClient();
    const payments = ref<SessionPaymentDetail[]>([]);
    const loading = ref(false);

    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    watch(
      () => props.visible,
      async (val) => {
        if (!val || !props.session) return;
        loading.value = true;
        try {
          payments.value = await client.getSessionPayments(props.session.sessionId);
        } catch {
          payments.value = [];
        } finally {
          loading.value = false;
        }
      }
    );

    return { payments, loading, formatCurrency, formatDate };
  },
});
</script>
