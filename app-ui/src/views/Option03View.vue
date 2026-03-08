<template>
  <div class="min-h-screen bg-slate-900 font-sans flex flex-col">
    <O3TopBar />

    <main class="flex-1 p-6 overflow-y-auto">
      <!-- Stats Row -->
      <O3StatsBar :appointments="allAppointments" />

      <!-- Widgets Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <!-- Calendar Widget -->
        <div class="xl:col-span-1">
          <O3Calendar
            :selectedDate="selectedDate"
            @date-selected="updateSelectedDate"
          />
        </div>
        <!-- Appointments Widget -->
        <div class="xl:col-span-2">
          <O3Appointments
            :selectedDate="selectedDate"
            @appointments-loaded="onAppointmentsLoaded"
          />
        </div>
      </div>
    </main>

    <O3Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import O3TopBar from '../components/option03/O3TopBar.vue';
import O3StatsBar from '../components/option03/O3StatsBar.vue';
import O3Calendar from '../components/option03/O3Calendar.vue';
import O3Appointments from '../components/option03/O3Appointments.vue';
import O3Footer from '../components/option03/O3Footer.vue';

export default defineComponent({
  name: 'Option03View',
  components: {
    O3TopBar,
    O3StatsBar,
    O3Calendar,
    O3Appointments,
    O3Footer,
  },
  setup() {
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));
    const allAppointments = ref<Appointment[]>([]);

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    const onAppointmentsLoaded = (appointments: Appointment[]) => {
      allAppointments.value = appointments;
    };

    return {
      selectedDate,
      allAppointments,
      updateSelectedDate,
      onAppointmentsLoaded,
    };
  },
});
</script>
