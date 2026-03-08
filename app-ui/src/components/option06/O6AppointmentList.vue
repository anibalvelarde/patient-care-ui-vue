<template>
  <div class="h-full flex flex-col bg-white border-r border-slate-200">
    <!-- List header -->
    <div class="px-4 py-3 border-b border-slate-100 flex-shrink-0">
      <p class="text-xs font-semibold text-slate-500">
        <span class="text-slate-800">{{ appointments.length }}</span> appointments
      </p>
    </div>

    <!-- Scrollable list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="appointments.length === 0" class="p-8 text-center">
        <svg class="w-10 h-10 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-slate-400">No appointments for this date</p>
      </div>

      <button
        v-for="appt in appointments"
        :key="appt.sessionId"
        @click="$emit('select', appt.sessionId)"
        :class="[
          'w-full text-left px-4 py-3 border-b border-slate-50 flex items-center gap-3 transition-colors',
          selectedId === appt.sessionId
            ? 'bg-blue-50 border-l-2 border-l-blue-500'
            : 'hover:bg-slate-50 border-l-2 border-l-transparent',
        ]"
      >
        <!-- Status dot -->
        <span
          :class="[
            'w-2 h-2 rounded-full flex-shrink-0',
            appt.isPaidOff
              ? 'bg-emerald-500'
              : appt.isPastDue
                ? 'bg-red-500'
                : 'bg-blue-500',
          ]"
        ></span>

        <!-- Name + details -->
        <div class="flex-1 min-w-0">
          <p :class="[
            'text-sm font-medium truncate',
            selectedId === appt.sessionId ? 'text-blue-900' : 'text-slate-800',
          ]">
            {{ appt.patient }}
          </p>
          <p class="text-[11px] text-slate-400 truncate">
            {{ appt.therapyTypes }}
          </p>
        </div>

        <!-- Time -->
        <span class="text-[11px] text-slate-400 flex-shrink-0">
          {{ appt.time || '—' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';

export default defineComponent({
  name: 'O6AppointmentList',
  props: {
    appointments: {
      type: Array as PropType<Appointment[]>,
      required: true,
    },
    selectedId: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  emits: ['select'],
});
</script>
