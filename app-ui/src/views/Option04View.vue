<template>
  <div class="min-h-screen bg-gray-100 font-sans flex flex-col h-screen">
    <O4TopBar
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Summary strip -->
    <div class="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-6">
      <div class="flex items-center gap-4 text-xs">
        <span class="text-gray-400">
          <span class="font-semibold text-gray-700">{{ allAppointments.length }}</span> total
        </span>
        <span class="text-gray-300">|</span>
        <span class="text-gray-400">
          <span class="font-semibold text-blue-600">{{ pendingCount }}</span> upcoming
        </span>
        <span class="text-gray-400">
          <span class="font-semibold text-emerald-600">{{ paidCount }}</span> completed
        </span>
        <span class="text-gray-400">
          <span class="font-semibold text-red-600">{{ pastDueCount }}</span> past due
        </span>
      </div>
    </div>

    <O4KanbanBoard
      :selectedDate="selectedDate"
      @appointments-loaded="onAppointmentsLoaded"
    />

    <O4Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import O4TopBar from '../components/option04/O4TopBar.vue';
import O4KanbanBoard from '../components/option04/O4KanbanBoard.vue';
import O4Footer from '../components/option04/O4Footer.vue';

export default defineComponent({
  name: 'Option04View',
  components: {
    O4TopBar,
    O4KanbanBoard,
    O4Footer,
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

    const pendingCount = computed(() =>
      allAppointments.value.filter((a) => !a.isPaidOff && !a.isPastDue).length
    );
    const paidCount = computed(() =>
      allAppointments.value.filter((a) => a.isPaidOff).length
    );
    const pastDueCount = computed(() =>
      allAppointments.value.filter((a) => a.isPastDue).length
    );

    return {
      selectedDate,
      allAppointments,
      updateSelectedDate,
      onAppointmentsLoaded,
      pendingCount,
      paidCount,
      pastDueCount,
    };
  },
});
</script>
