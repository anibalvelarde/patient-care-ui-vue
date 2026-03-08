<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <!-- Card Header -->
    <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-slate-700">{{ title }}</h3>
        <span
          :class="[
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            badgeColor === 'amber'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700',
          ]"
        >
          {{ badge }}
        </span>
      </div>
      <span class="text-xs text-slate-400">{{ appointments.length }} appointments</span>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto max-h-72 overflow-y-auto">
      <table v-if="appointments.length > 0" class="w-full text-sm">
        <thead class="bg-slate-50 sticky top-0">
          <tr>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapy</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapist</th>
            <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
            <th class="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="appt in appointments"
            :key="appt.sessionId"
            :class="[
              'transition-colors',
              appt.isPastDue
                ? 'bg-red-50 hover:bg-red-100'
                : 'hover:bg-slate-50',
            ]"
          >
            <td class="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">{{ appt.time || '--' }}</td>
            <td class="px-4 py-3 text-slate-700">{{ appt.patient }}</td>
            <td class="px-4 py-3 text-slate-500">{{ appt.therapyTypes }}</td>
            <td class="px-4 py-3 text-slate-500">{{ appt.therapist }}</td>
            <td class="px-4 py-3 text-slate-400 text-xs max-w-[200px] relative group">
              <span class="block truncate cursor-default">{{ appt.notes || '--' }}</span>
              <div
                v-if="appt.notes"
                class="hidden group-hover:block absolute z-20 top-1/2 right-full -translate-y-1/2 mr-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg leading-relaxed whitespace-normal"
              >
                {{ appt.notes }}
                <div class="absolute top-1/2 left-full w-2 h-2 bg-slate-800 rotate-45 -translate-y-1/2 -ml-1"></div>
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-2">
                <!-- Payment status -->
                <span
                  v-if="appt.isPaidOff"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                >
                  <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-[10px]" />
                  Paid
                </span>
                <span
                  v-else-if="appt.isPastDue"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                >
                  <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-[10px]" />
                  Past Due
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500"
                >
                  <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-[10px]" />
                  Pending
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-else class="px-5 py-10 text-center">
        <p class="text-sm text-slate-400">No {{ title.toLowerCase() }} appointments</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faFileInvoiceDollar, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

library.add(faFileInvoiceDollar, faExclamationCircle);

export default defineComponent({
  name: 'O1AppointmentCard',
  components: { FontAwesomeIcon },
  props: {
    title: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      required: true,
    },
    badgeColor: {
      type: String as PropType<'amber' | 'blue'>,
      required: true,
    },
    appointments: {
      type: Array as PropType<Appointment[]>,
      required: true,
    },
  },
});
</script>
