<template>
  <div class="space-y-4">
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="bg-white rounded-xl border border-slate-200 px-5 py-3"
      >
        <div class="flex items-center space-x-3">
          <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', card.bgColor]">
            <span :class="['text-lg font-bold', card.textColor]">{{ card.count }}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">{{ card.label }}</p>
            <p class="text-xs text-slate-400">{{ card.sublabel }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs + Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          @click="$emit('filter-change', tab.value)"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            activeFilter === tab.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('book')"
          class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + Book Appointment
        </button>
        <button
          @click="$emit('walkin')"
          class="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
        >
          Walk-In
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
      <p class="text-sm text-red-700">{{ error }}</p>
      <button @click="$emit('retry')" class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">
        Try again
      </button>
    </div>

    <!-- Table -->
    <AppointmentsTable
      v-else
      :appointments="filteredAppointments"
      @status-change="(appt, action) => $emit('status-change', appt, action)"
      @show-actions="(appt) => $emit('show-actions', appt)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import AppointmentsTable from './AppointmentsTable.vue';
import type { Appointment } from '../../interfaces/Appointment';

export default defineComponent({
  name: 'AppointmentsList',
  components: { AppointmentsTable },
  props: {
    appointments: { type: Array as PropType<Appointment[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    activeFilter: { type: String, default: 'all' },
  },
  emits: ['book', 'walkin', 'retry', 'filter-change', 'status-change', 'show-actions'],
  setup(props) {
    const filterTabs = [
      { label: 'All', value: 'all' },
      { label: 'Proposed', value: 'Proposed' },
      { label: 'Confirmed', value: 'Confirmed' },
      { label: 'Checked In', value: 'CheckedIn' },
      { label: 'In Therapy', value: 'InTherapy' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Cancelled', value: 'cancelled' },
    ];

    const filteredAppointments = computed(() => {
      if (props.activeFilter === 'all') return props.appointments;
      if (props.activeFilter === 'cancelled') {
        return props.appointments.filter(a => a.appointmentStatusId === 3 || a.appointmentStatusId === 5);
      }
      return props.appointments.filter(a => a.statusName === props.activeFilter);
    });

    const summaryCards = computed(() => {
      const all = props.appointments;
      return [
        {
          label: 'Proposed',
          sublabel: 'Awaiting confirmation',
          count: all.filter(a => a.appointmentStatusId === 1).length,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
        },
        {
          label: 'Confirmed',
          sublabel: 'Ready for visit',
          count: all.filter(a => a.appointmentStatusId === 2).length,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
        },
        {
          label: 'In Progress',
          sublabel: 'Checked in / In therapy',
          count: all.filter(a => a.appointmentStatusId === 6 || a.appointmentStatusId === 7).length,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
        },
        {
          label: 'Completed',
          sublabel: 'Today',
          count: all.filter(a => a.appointmentStatusId === 4).length,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
        },
      ];
    });

    return { filterTabs, filteredAppointments, summaryCards };
  },
});
</script>
