<template>
  <div class="bg-white rounded-2xl border border-stone-150 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
    <!-- Card header -->
    <div class="px-6 pt-5 pb-4 flex items-start justify-between">
      <div>
        <h3 class="text-lg font-bold text-stone-800">{{ appointment.patient }}</h3>
        <p class="text-sm text-stone-400 mt-0.5">{{ appointment.therapyTypes }}</p>
      </div>
      <span
        :class="[
          'px-3 py-1 rounded-full text-xs font-semibold',
          appointment.isPaidOff
            ? 'bg-emerald-50 text-emerald-700'
            : appointment.isPastDue
              ? 'bg-rose-50 text-rose-700'
              : 'bg-amber-50 text-amber-700',
        ]"
      >
        {{ appointment.isPaidOff ? 'Paid' : appointment.isPastDue ? 'Past Due' : 'Pending' }}
      </span>
    </div>

    <!-- Info row -->
    <div class="px-6 pb-4 flex items-center gap-4 text-sm">
      <div class="flex items-center gap-1.5 text-stone-500">
        <svg class="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {{ appointment.therapist }}
      </div>
      <div class="flex items-center gap-1.5 text-stone-500">
        <svg class="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ appointment.time || 'No time set' }}
      </div>
    </div>

    <!-- Payment row -->
    <div class="px-6 pb-4">
      <div class="grid grid-cols-4 gap-3">
        <div class="bg-stone-50 rounded-xl px-3 py-2.5 text-center">
          <p class="text-xs text-stone-400 mb-0.5">Amount</p>
          <p class="text-sm font-bold text-stone-700">${{ appointment.amount.toFixed(2) }}</p>
        </div>
        <div class="bg-stone-50 rounded-xl px-3 py-2.5 text-center">
          <p class="text-xs text-stone-400 mb-0.5">Discount</p>
          <p class="text-sm font-bold text-orange-600">${{ appointment.discount.toFixed(2) }}</p>
        </div>
        <div class="bg-stone-50 rounded-xl px-3 py-2.5 text-center">
          <p class="text-xs text-stone-400 mb-0.5">Paid</p>
          <p class="text-sm font-bold text-emerald-600">${{ appointment.amountPaid.toFixed(2) }}</p>
        </div>
        <div class="bg-stone-50 rounded-xl px-3 py-2.5 text-center">
          <p class="text-xs text-stone-400 mb-0.5">Due</p>
          <p :class="[
            'text-sm font-bold',
            appointment.amountDue > 0 ? 'text-rose-600' : 'text-stone-400',
          ]">
            ${{ appointment.amountDue.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="appointment.notes" class="px-6 pb-5">
      <div class="bg-amber-50/50 rounded-xl px-4 py-3 border border-amber-100">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-1">Notes</p>
        <p class="text-sm text-stone-600 leading-relaxed">{{ appointment.notes }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';

export default defineComponent({
  name: 'O7AppointmentCard',
  props: {
    appointment: {
      type: Object as PropType<Appointment>,
      required: true,
    },
  },
});
</script>
