<template>
  <div>
    <!-- Heading -->
    <div class="mb-6">
      <h3 class="text-base font-semibold text-stone-700">
        Today's Appointments
        <span class="ml-2 text-sm font-normal text-stone-400">{{ appointments.length }}</span>
      </h3>
    </div>

    <!-- Empty state -->
    <div v-if="appointments.length === 0" class="py-16 text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
        <svg class="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-stone-400 text-sm">No appointments scheduled for this day</p>
      <p class="text-stone-300 text-xs mt-1">Select a different date to view appointments</p>
    </div>

    <!-- Card list -->
    <div v-else class="flex flex-col gap-5">
      <O7AppointmentCard
        v-for="appt in appointments"
        :key="appt.sessionId"
        :appointment="appt"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import O7AppointmentCard from './O7AppointmentCard.vue';

export default defineComponent({
  name: 'O7AppointmentList',
  components: { O7AppointmentCard },
  props: {
    appointments: {
      type: Array as PropType<Appointment[]>,
      required: true,
    },
  },
});
</script>
