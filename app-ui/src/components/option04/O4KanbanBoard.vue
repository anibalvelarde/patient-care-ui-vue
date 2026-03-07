<template>
  <div class="flex-1 overflow-x-auto overflow-y-hidden">
    <div class="flex gap-4 p-6 h-full min-w-[900px]">
      <!-- Kanban Columns -->
      <div
        v-for="col in columns"
        :key="col.key"
        class="flex-1 min-w-[220px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
      >
        <!-- Column Header -->
        <div :class="['px-4 py-3 border-b-2 flex items-center justify-between', col.borderClass]">
          <div class="flex items-center gap-2">
            <div :class="['w-2.5 h-2.5 rounded-full', col.dotClass]"></div>
            <h3 class="text-sm font-semibold text-gray-700">{{ col.title }}</h3>
          </div>
          <span :class="['text-xs font-bold px-2 py-0.5 rounded-full', col.countClass]">
            {{ col.items.length }}
          </span>
        </div>

        <!-- Cards -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div
            v-for="appt in col.items"
            :key="appt.sessionId"
            :class="[
              'bg-white rounded-lg border shadow-sm p-3.5 transition-all duration-150 hover:shadow-md cursor-default',
              col.cardBorder,
            ]"
          >
            <!-- Card top: Patient + Time -->
            <div class="flex items-start justify-between mb-2">
              <p class="text-sm font-semibold text-gray-800 leading-tight">{{ appt.patient }}</p>
              <span class="text-[10px] font-mono font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                {{ appt.time || '--:--' }}
              </span>
            </div>

            <!-- Therapy + Therapist -->
            <p class="text-xs text-gray-500 mb-2 leading-snug">
              {{ appt.therapyTypes }}
              <span class="text-gray-300">&middot;</span>
              {{ appt.therapist }}
            </p>

            <!-- Card bottom: Amount + Notes -->
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <span class="text-xs font-semibold text-gray-700">${{ appt.amount.toFixed(2) }}</span>
                <span v-if="appt.amountDue > 0" class="text-[10px] text-red-500 ml-1">
                  (${{ appt.amountDue.toFixed(2) }} due)
                </span>
              </div>

              <!-- Notes tooltip -->
              <div v-if="appt.notes" class="relative group">
                <font-awesome-icon
                  :icon="['fas', 'sticky-note']"
                  class="text-gray-300 hover:text-indigo-500 cursor-pointer transition-colors text-xs"
                />
                <div class="hidden group-hover:block absolute z-30 top-1/2 right-full -translate-y-1/2 mr-2 w-52 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg leading-relaxed whitespace-normal">
                  {{ appt.notes }}
                  <div class="absolute top-1/2 left-full w-2 h-2 bg-gray-800 rotate-45 -translate-y-1/2 -ml-1"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty column -->
          <div v-if="col.items.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-300">
            <font-awesome-icon :icon="['fas', col.emptyIcon]" class="text-2xl mb-2" />
            <p class="text-xs">{{ col.emptyText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faStickyNote,
  faClock,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

library.add(faStickyNote, faClock, faSpinner, faCheckCircle, faExclamationTriangle);

export default defineComponent({
  name: 'O4KanbanBoard',
  components: { FontAwesomeIcon },
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['appointments-loaded'],
  setup(props, { emit }) {
    const sessionsHttpClient = new SessionsHttpClient();
    const allAppointments = ref<Appointment[]>([]);

    const fetchAppointments = async (date: string) => {
      try {
        const appointments = await sessionsHttpClient.getSessions(date);
        allAppointments.value = appointments;
        emit('appointments-loaded', appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
        emit('appointments-loaded', []);
      }
    };

    const upcoming = computed(() =>
      allAppointments.value.filter((a) => !a.isPaidOff && !a.isPastDue)
    );

    const completed = computed(() =>
      allAppointments.value.filter((a) => a.isPaidOff)
    );

    const pastDue = computed(() =>
      allAppointments.value.filter((a) => a.isPastDue)
    );

    const columns = computed(() => [
      {
        key: 'upcoming',
        title: 'Upcoming',
        items: upcoming.value,
        borderClass: 'border-b-blue-400',
        dotClass: 'bg-blue-400',
        countClass: 'bg-blue-100 text-blue-700',
        cardBorder: 'border-gray-200 hover:border-blue-300',
        emptyIcon: 'clock',
        emptyText: 'No upcoming appointments',
      },
      {
        key: 'completed',
        title: 'Completed / Paid',
        items: completed.value,
        borderClass: 'border-b-emerald-400',
        dotClass: 'bg-emerald-400',
        countClass: 'bg-emerald-100 text-emerald-700',
        cardBorder: 'border-gray-200 hover:border-emerald-300',
        emptyIcon: 'check-circle',
        emptyText: 'No completed yet',
      },
      {
        key: 'pastdue',
        title: 'Past Due',
        items: pastDue.value,
        borderClass: 'border-b-red-400',
        dotClass: 'bg-red-400',
        countClass: 'bg-red-100 text-red-700',
        cardBorder: 'border-red-200 hover:border-red-300',
        emptyIcon: 'exclamation-triangle',
        emptyText: 'No past due',
      },
    ]);

    onMounted(() => {
      fetchAppointments(props.selectedDate);
    });

    watch(
      () => props.selectedDate,
      (newDate) => {
        fetchAppointments(newDate);
      }
    );

    return { columns };
  },
});
</script>
