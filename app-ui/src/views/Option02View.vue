<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <O2Header />
        <main class="flex-1 p-6 overflow-y-auto">
          <O2StatsBar :appointments="allAppointments" />
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div class="xl:col-span-1">
              <O2Calendar
                :selectedDate="selectedDate"
                @date-selected="updateSelectedDate"
              />
            </div>
            <div class="xl:col-span-2">
              <O2Appointments
                :selectedDate="selectedDate"
                @appointments-loaded="onAppointmentsLoaded"
              />
            </div>
          </div>
        </main>
        <O2Footer />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2StatsBar from '../components/option02/O2StatsBar.vue';
import O2Calendar from '../components/option02/O2Calendar.vue';
import O2Appointments from '../components/option02/O2Appointments.vue';
import O2Footer from '../components/option02/O2Footer.vue';

export default defineComponent({
  name: 'Option02View',
  components: {
    O2MobileNav,
    O2Sidebar,
    O2Header,
    O2StatsBar,
    O2Calendar,
    O2Appointments,
    O2Footer,
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
