<template>
  <div class="h-full overflow-y-auto bg-slate-50">
    <!-- Empty state -->
    <div v-if="!appointment" class="h-full flex items-center justify-center">
      <div class="text-center">
        <svg class="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm text-slate-400">Select an appointment to view details</p>
      </div>
    </div>

    <!-- Detail view -->
    <div v-else class="p-6">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ appointment.patient }}</h2>
          <p class="text-sm text-slate-400 mt-0.5">Session #{{ appointment.sessionId }}</p>
        </div>
        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold',
            appointment.isPaidOff
              ? 'bg-emerald-100 text-emerald-700'
              : appointment.isPastDue
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700',
          ]"
        >
          {{ appointment.isPaidOff ? 'Paid' : appointment.isPastDue ? 'Past Due' : 'Pending' }}
        </span>
      </div>

      <!-- Info cards -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Therapist</p>
          <p class="text-sm font-medium text-slate-800">{{ appointment.therapist }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Therapy Type</p>
          <p class="text-sm font-medium text-slate-800">{{ appointment.therapyTypes }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Time</p>
          <p class="text-sm font-medium text-slate-800">{{ appointment.time || 'Not specified' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Date</p>
          <p class="text-sm font-medium text-slate-800">{{ formattedSessionDate }}</p>
        </div>
      </div>

      <!-- Payment breakdown -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Payment Details</p>
        <div class="grid grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-lg font-bold text-slate-800">${{ appointment.amount.toFixed(2) }}</p>
            <p class="text-[10px] text-slate-400">Amount</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-orange-600">${{ appointment.discount.toFixed(2) }}</p>
            <p class="text-[10px] text-slate-400">Discount</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-emerald-600">${{ appointment.amountPaid.toFixed(2) }}</p>
            <p class="text-[10px] text-slate-400">Paid</p>
          </div>
          <div class="text-center">
            <p :class="[
              'text-lg font-bold',
              appointment.amountDue > 0 ? 'text-red-600' : 'text-slate-400',
            ]">
              ${{ appointment.amountDue.toFixed(2) }}
            </p>
            <p class="text-[10px] text-slate-400">Due</p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="appointment.notes" class="bg-white rounded-xl border border-slate-200 p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</p>
        <p class="text-sm text-slate-600 leading-relaxed">{{ appointment.notes }}</p>
      </div>
      <div v-else class="bg-white rounded-xl border border-slate-100 p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Notes</p>
        <p class="text-sm text-slate-300 italic">No notes for this appointment</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Appointment } from '../../interfaces/Appointment';

export default defineComponent({
  name: 'O6DetailPanel',
  props: {
    appointment: {
      type: Object as PropType<Appointment | null>,
      default: null,
    },
  },
  setup(props) {
    const formattedSessionDate = computed(() => {
      if (!props.appointment) return '';
      const d = new Date(props.appointment.sessionDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    });

    return { formattedSessionDate };
  },
});
</script>
