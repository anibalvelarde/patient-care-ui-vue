<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Therapist</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="appt in appointments"
            :key="appt.sessionId"
            class="hover:bg-slate-50 transition-colors"
          >
            <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ appt.sessionDate }}</td>
            <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{{ appt.sessionTime }}</td>
            <td class="px-4 py-3 text-sm text-slate-800 font-medium">{{ appt.patient }}</td>
            <td class="px-4 py-3 text-sm text-slate-700">{{ appt.therapist }}</td>
            <td class="px-4 py-3 text-sm text-slate-500">{{ appt.therapyTypes || 'N/A' }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status-id="appt.appointmentStatusId" :status-name="appt.statusName" />
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">${{ appt.amount.toFixed(2) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end space-x-1">
                <!-- Next logical action button -->
                <button
                  v-if="nextAction(appt)"
                  @click="$emit('status-change', appt, nextAction(appt)!.action)"
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                    nextAction(appt)!.class,
                  ]"
                  :title="nextAction(appt)!.label"
                >
                  {{ nextAction(appt)!.label }}
                </button>
                <!-- More actions dropdown trigger -->
                <button
                  @click="$emit('show-actions', appt)"
                  class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="More actions"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="appointments.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-sm text-slate-400">
              No appointments found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import StatusBadge from './StatusBadge.vue';
import type { Appointment } from '../../interfaces/Appointment';

interface ActionInfo {
  label: string;
  action: string;
  class: string;
}

export default defineComponent({
  name: 'AppointmentsTable',
  components: { StatusBadge },
  props: {
    appointments: { type: Array as PropType<Appointment[]>, required: true },
  },
  emits: ['status-change', 'show-actions'],
  setup() {
    const nextAction = (appt: Appointment): ActionInfo | null => {
      switch (appt.appointmentStatusId) {
        case 1: // Proposed
          return { label: 'Confirm', action: 'confirm', class: 'bg-green-50 text-green-700 hover:bg-green-100' };
        case 2: // Confirmed
          return { label: 'Check In', action: 'checkin', class: 'bg-blue-50 text-blue-700 hover:bg-blue-100' };
        case 6: // CheckedIn
          return { label: 'Start', action: 'start-therapy', class: 'bg-purple-50 text-purple-700 hover:bg-purple-100' };
        case 7: // InTherapy
          return { label: 'Complete', action: 'complete', class: 'bg-gray-50 text-gray-700 hover:bg-gray-100' };
        default:
          return null; // Completed, Cancelled, NoShow — no next action
      }
    };

    return { nextAction };
  },
});
</script>
