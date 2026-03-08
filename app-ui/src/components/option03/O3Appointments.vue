<template>
  <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden h-full flex flex-col">
    <!-- Header with tabs -->
    <div class="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-200">
        <font-awesome-icon :icon="['fas', 'list']" class="mr-1.5 text-cyan-400" />
        Appointments
        <span class="text-xs font-normal text-slate-500 ml-1">{{ selectedDate }}</span>
      </h2>
      <div class="flex bg-slate-900/60 rounded-lg p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            activeTab === tab.key
              ? 'bg-cyan-500/15 text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-300',
          ]"
        >
          {{ tab.label }} ({{ tab.key === 'am' ? amAppointments.length : tab.key === 'pm' ? pmAppointments.length : allAppointments.length }})
        </button>
      </div>
    </div>

    <!-- Data-dense table -->
    <div class="flex-1 overflow-y-auto max-h-[480px]">
      <!-- Table header -->
      <div class="sticky top-0 bg-slate-800 px-5 py-2 grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
        <div class="col-span-1">Time</div>
        <div class="col-span-3">Patient</div>
        <div class="col-span-3">Therapy / Therapist</div>
        <div class="col-span-2 text-right">Amount</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-1 text-center">Notes</div>
      </div>

      <div v-if="visibleAppointments.length > 0" class="divide-y divide-slate-700/30">
        <div
          v-for="appt in visibleAppointments"
          :key="appt.sessionId"
          :class="[
            'px-5 py-2.5 grid grid-cols-12 gap-2 items-center transition-colors text-sm',
            appt.isPastDue
              ? 'bg-red-500/5 hover:bg-red-500/10'
              : 'hover:bg-slate-700/30',
          ]"
        >
          <!-- Time -->
          <div class="col-span-1">
            <span class="text-xs font-mono font-semibold text-slate-300">{{ appt.time || '--' }}</span>
          </div>

          <!-- Patient -->
          <div class="col-span-3 min-w-0">
            <p class="text-sm font-medium text-slate-200 truncate">{{ appt.patient }}</p>
          </div>

          <!-- Therapy / Therapist -->
          <div class="col-span-3 min-w-0">
            <p class="text-xs text-slate-400 truncate">{{ appt.therapyTypes }}</p>
            <p class="text-[10px] text-slate-500 truncate">{{ appt.therapist }}</p>
          </div>

          <!-- Amount -->
          <div class="col-span-2 text-right">
            <p class="text-xs font-semibold text-slate-200">${{ appt.amount.toFixed(2) }}</p>
            <p v-if="appt.amountDue > 0" class="text-[10px] text-red-400">
              Due: ${{ appt.amountDue.toFixed(2) }}
            </p>
          </div>

          <!-- Status -->
          <div class="col-span-2">
            <span
              v-if="appt.isPaidOff"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400"
            >
              <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[9px]" />
              Paid
            </span>
            <span
              v-else-if="appt.isPastDue"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400"
            >
              <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-[9px]" />
              Past Due
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-600/30 text-slate-400"
            >
              Pending
            </span>
          </div>

          <!-- Notes tooltip -->
          <div class="col-span-1 flex justify-center">
            <div v-if="appt.notes" class="relative group">
              <font-awesome-icon
                :icon="['fas', 'sticky-note']"
                class="text-slate-600 hover:text-cyan-400 cursor-pointer transition-colors"
              />
              <div class="hidden group-hover:block absolute z-20 top-1/2 right-full -translate-y-1/2 mr-2 w-56 p-3 bg-slate-700 text-slate-200 text-xs rounded-lg shadow-xl leading-relaxed whitespace-normal border border-slate-600">
                {{ appt.notes }}
                <div class="absolute top-1/2 left-full w-2 h-2 bg-slate-700 rotate-45 -translate-y-1/2 -ml-1 border-r border-t border-slate-600"></div>
              </div>
            </div>
            <span v-else class="text-slate-700">--</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-slate-500">
        <font-awesome-icon :icon="['fas', 'calendar-day']" class="text-3xl mb-2 text-slate-600" />
        <p class="text-sm">No appointments for this date</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faList,
  faStickyNote,
  faCheckCircle,
  faExclamationCircle,
  faCalendarDay,
} from '@fortawesome/free-solid-svg-icons';

library.add(faList, faStickyNote, faCheckCircle, faExclamationCircle, faCalendarDay);

export default defineComponent({
  name: 'O3Appointments',
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
    const activeTab = ref<'all' | 'am' | 'pm'>('all');

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
        allAppointments.value = appointments;
        emit('appointments-loaded', appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
        emit('appointments-loaded', []);
      }
    };

    const amAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'AM')
    );

    const pmAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'PM')
    );

    const visibleAppointments = computed(() => {
      if (activeTab.value === 'am') return amAppointments.value;
      if (activeTab.value === 'pm') return pmAppointments.value;
      return allAppointments.value;
    });

    const tabs = [
      { key: 'all' as const, label: 'All' },
      { key: 'am' as const, label: 'AM' },
      { key: 'pm' as const, label: 'PM' },
    ];

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
      allAppointments,
      amAppointments,
      pmAppointments,
      visibleAppointments,
      activeTab,
      tabs,
    };
  },
});
</script>
