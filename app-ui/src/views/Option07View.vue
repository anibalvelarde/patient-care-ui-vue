<template>
  <div class="min-h-screen bg-[#FFFBF5] font-sans flex flex-col">
    <!-- Header -->
    <O7Header
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Week pills -->
    <O7WeekPills
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Main content -->
    <main class="flex-1 px-6 py-8">
      <div class="max-w-3xl mx-auto">
        <O7AppointmentList :appointments="allAppointments" />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-[#FFFBF5] border-t border-amber-100 px-6 py-3 flex-shrink-0">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <p class="text-xs text-stone-400">&copy; {{ currentYear }} Neurocorp Therapy Center</p>
        <p class="text-xs text-stone-400">Option 07 &mdash; Warm Minimal</p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import O7Header from '../components/option07/O7Header.vue';
import O7WeekPills from '../components/option07/O7WeekPills.vue';
import O7AppointmentList from '../components/option07/O7AppointmentList.vue';

export default defineComponent({
  name: 'Option07View',
  components: {
    O7Header,
    O7WeekPills,
    O7AppointmentList,
  },
  setup() {
    const sessionsHttpClient = new SessionsHttpClient();
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));
    const allAppointments = ref<Appointment[]>([]);
    const currentYear = new Date().getFullYear();

    const fetchAppointments = async (date: string) => {
      try {
        allAppointments.value = await sessionsHttpClient.getSessions(date);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
      }
    };

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    onMounted(() => {
      fetchAppointments(selectedDate.value);
    });

    watch(selectedDate, (newDate) => {
      fetchAppointments(newDate);
    });

    return {
      selectedDate,
      allAppointments,
      updateSelectedDate,
      currentYear,
    };
  },
});
</script>
