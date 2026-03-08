<template>
  <div class="space-y-6">
    <!-- Section Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Appointments</h2>
        <p class="text-sm text-slate-400 mt-0.5">{{ selectedDate }}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">
          {{ amAppointments.length + pmAppointments.length }} total
        </span>
      </div>
    </div>

    <!-- AM Section -->
    <O1AppointmentCard
      title="Morning"
      badge="AM"
      badgeColor="amber"
      :appointments="amAppointments"
    />

    <!-- PM Section -->
    <O1AppointmentCard
      title="Afternoon"
      badge="PM"
      badgeColor="blue"
      :appointments="pmAppointments"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import O1AppointmentCard from './O1AppointmentCard.vue';

export default defineComponent({
  name: 'O1Appointments',
  components: { O1AppointmentCard },
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const sessionsHttpClient = new SessionsHttpClient();
    const amAppointments = ref<Appointment[]>([]);
    const pmAppointments = ref<Appointment[]>([]);

    const determineTime = (app: Appointment): 'AM' | 'PM' => {
      if (app.time) {
        const hour = parseInt(app.time.split(':')[0]);
        return hour < 12 ? 'AM' : 'PM';
      }
      return Math.random() <= 0.5 ? 'AM' : 'PM';
    };

    const fetchAppointments = async (date: string) => {
      try {
        const appointments = await sessionsHttpClient.getSessions(date);
        const amApps = appointments.filter((a: Appointment) => determineTime(a) === 'AM');
        const pmApps = appointments.filter(
          (a: Appointment) => determineTime(a) === 'PM' && !amApps.some((am) => am.sessionId === a.sessionId)
        );
        amAppointments.value = amApps;
        pmAppointments.value = pmApps;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        amAppointments.value = [];
        pmAppointments.value = [];
      }
    };

    onMounted(() => {
      fetchAppointments(props.selectedDate);
    });

    watch(
      () => props.selectedDate,
      (newDate) => {
        fetchAppointments(newDate);
      }
    );

    return {
      amAppointments,
      pmAppointments,
    };
  },
});
</script>
