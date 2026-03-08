<template>
  <div class="h-screen bg-slate-100 font-sans flex flex-col overflow-hidden">
    <!-- Header -->
    <O6Header
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Collapsible calendar -->
    <O6Calendar
      :selectedDate="selectedDate"
      @date-selected="updateSelectedDate"
    />

    <!-- Split panel: List | Detail -->
    <div class="flex-1 flex min-h-0">
      <!-- Left: compact list -->
      <div class="w-[340px] flex-shrink-0">
        <O6AppointmentList
          :appointments="allAppointments"
          :selectedId="selectedId"
          @select="selectAppointment"
        />
      </div>

      <!-- Right: detail panel -->
      <div class="flex-1 min-w-0">
        <O6DetailPanel :appointment="selectedAppointment" />
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 px-5 py-1.5 flex items-center justify-between flex-shrink-0">
      <p class="text-[9px] text-slate-400">&copy; {{ currentYear }} Neurocorp Therapy Center</p>
      <p class="text-[9px] text-slate-400">Option 06 &mdash; Split Panel</p>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import O6Header from '../components/option06/O6Header.vue';
import O6Calendar from '../components/option06/O6Calendar.vue';
import O6AppointmentList from '../components/option06/O6AppointmentList.vue';
import O6DetailPanel from '../components/option06/O6DetailPanel.vue';

export default defineComponent({
  name: 'Option06View',
  components: {
    O6Header,
    O6Calendar,
    O6AppointmentList,
    O6DetailPanel,
  },
  setup() {
    const sessionsHttpClient = new SessionsHttpClient();
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));
    const allAppointments = ref<Appointment[]>([]);
    const selectedId = ref<number | null>(null);
    const currentYear = new Date().getFullYear();

    const fetchAppointments = async (date: string) => {
      try {
        allAppointments.value = await sessionsHttpClient.getSessions(date);
        // Auto-select first appointment if available
        if (allAppointments.value.length > 0) {
          selectedId.value = allAppointments.value[0].sessionId;
        } else {
          selectedId.value = null;
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
        selectedId.value = null;
      }
    };

    const selectedAppointment = computed(() => {
      if (selectedId.value === null) return null;
      return allAppointments.value.find((a) => a.sessionId === selectedId.value) || null;
    });

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    const selectAppointment = (id: number) => {
      selectedId.value = id;
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
      selectedId,
      selectedAppointment,
      updateSelectedDate,
      selectAppointment,
      currentYear,
    };
  },
});
</script>
