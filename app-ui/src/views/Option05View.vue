<template>
  <div class="h-screen bg-gray-100 font-sans flex flex-col overflow-hidden">
    <!-- Top bar -->
    <O5Header
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Stats strip -->
    <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex-shrink-0">
      <O5StatsStrip :appointments="allAppointments" />
    </div>

    <!-- Main grid: Calendar | AM Table | PM Table -->
    <div class="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0">
      <!-- Calendar (narrow left) -->
      <div class="col-span-2">
        <O5MiniCalendar
          :selectedDate="selectedDate"
          @date-selected="updateSelectedDate"
        />
      </div>

      <!-- AM Appointments -->
      <div class="col-span-5">
        <O5AppointmentTable
          title="AM"
          :appointments="amAppointments"
          headerColor="text-amber-700"
          headerBorder="border-amber-200"
        />
      </div>

      <!-- PM Appointments -->
      <div class="col-span-5">
        <O5AppointmentTable
          title="PM"
          :appointments="pmAppointments"
          headerColor="text-indigo-700"
          headerBorder="border-indigo-200"
        />
      </div>
    </div>

    <!-- Alert strip at bottom -->
    <O5AlertStrip :appointments="allAppointments" />

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
      <p class="text-[9px] text-gray-400">&copy; {{ currentYear }} Neurocorp Therapy Center</p>
      <p class="text-[9px] text-gray-400">Option 05 &mdash; Command Center</p>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import O5Header from '../components/option05/O5Header.vue';
import O5StatsStrip from '../components/option05/O5StatsStrip.vue';
import O5MiniCalendar from '../components/option05/O5MiniCalendar.vue';
import O5AppointmentTable from '../components/option05/O5AppointmentTable.vue';
import O5AlertStrip from '../components/option05/O5AlertStrip.vue';

export default defineComponent({
  name: 'Option05View',
  components: {
    O5Header,
    O5StatsStrip,
    O5MiniCalendar,
    O5AppointmentTable,
    O5AlertStrip,
  },
  setup() {
    const sessionsHttpClient = new SessionsHttpClient();
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));
    const allAppointments = ref<Appointment[]>([]);
    const currentYear = new Date().getFullYear();

    const determineTime = (app: Appointment): 'AM' | 'PM' => {
      if (app.time) {
        const hour = parseInt(app.time.split(':')[0]);
        return hour < 12 ? 'AM' : 'PM';
      }
      return Math.random() <= 0.5 ? 'AM' : 'PM';
    };

    const fetchAppointments = async (date: string) => {
      try {
        allAppointments.value = await sessionsHttpClient.getSessions(date);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
      }
    };

    const amAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'AM')
    );

    const pmAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'PM')
    );

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
      amAppointments,
      pmAppointments,
      updateSelectedDate,
      currentYear,
    };
  },
});
</script>
