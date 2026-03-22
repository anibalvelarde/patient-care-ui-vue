<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-200">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Caretaker</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        <tr v-for="payment in payments" :key="payment.paymentId" class="hover:bg-slate-50">
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
            {{ formatDate(payment.paymentDate) }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
            {{ payment.caretakerName }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700 text-right font-medium">
            {{ formatCurrency(payment.amount) }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              {{ payment.paymentType.abbreviation }}
            </span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-700 text-right">
            {{ formatCurrency(payment.totalAllocated) }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm">
            <span :class="statusClass(payment)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
              {{ statusLabel(payment) }}
            </span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-right">
            <button
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              @click="$emit('edit', payment)"
            >
              Edit
            </button>
          </td>
        </tr>
        <tr v-if="payments.length === 0">
          <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-400">
            No payments found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { PaymentRecord } from '../../interfaces/Payment';

export default defineComponent({
  name: 'PaymentTable',
  props: {
    payments: { type: Array as PropType<PaymentRecord[]>, required: true },
  },
  emits: ['edit'],
  setup() {
    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const statusLabel = (payment: PaymentRecord) => {
      if (payment.totalAllocated >= payment.amount) return 'Fully Allocated';
      if (payment.totalAllocated > 0) return 'Partially Allocated';
      return 'Unallocated';
    };

    const statusClass = (payment: PaymentRecord) => {
      if (payment.totalAllocated >= payment.amount) return 'bg-green-100 text-green-800';
      if (payment.totalAllocated > 0) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    return { formatCurrency, formatDate, statusLabel, statusClass };
  },
});
</script>
