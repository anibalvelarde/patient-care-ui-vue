<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
    <!-- Header -->
    <div :class="['px-3 py-2 border-b flex items-center justify-between', headerBorder]">
      <h3 :class="['text-[11px] font-bold uppercase tracking-wider', headerColor]">
        {{ title }}
      </h3>
      <span class="text-[10px] font-semibold text-gray-400">{{ appointments.length }} appts</span>
    </div>

    <!-- Compact table -->
    <div class="flex-1 overflow-y-auto">
      <!-- Column headers -->
      <div class="sticky top-0 bg-gray-50 px-3 py-1 grid grid-cols-12 gap-1 text-[8px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
        <div class="col-span-1">Time</div>
        <div class="col-span-3">Patient</div>
        <div class="col-span-3">Therapy</div>
        <div class="col-span-2">Therapist</div>
        <div class="col-span-1 text-right">Amt</div>
        <div class="col-span-1 text-center">St</div>
        <div class="col-span-1 text-center">N</div>
      </div>

      <div v-if="appointments.length > 0" class="divide-y divide-gray-50">
        <div
          v-for="appt in appointments"
          :key="appt.sessionId"
          :class="[
            'px-3 py-1.5 grid grid-cols-12 gap-1 items-center transition-colors',
            appt.isPastDue ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50',
          ]"
        >
          <div class="col-span-1">
            <span class="text-[10px] font-mono font-semibold text-gray-500">{{ appt.time || '--' }}</span>
          </div>
          <div class="col-span-3 truncate">
            <span class="text-[11px] font-medium text-gray-800">{{ appt.patient }}</span>
          </div>
          <div class="col-span-3 truncate">
            <span class="text-[10px] text-gray-500">{{ appt.therapyTypes }}</span>
          </div>
          <div class="col-span-2 truncate">
            <span class="text-[10px] text-gray-400">{{ appt.therapist }}</span>
          </div>
          <div class="col-span-1 text-right">
            <span class="text-[10px] font-semibold text-gray-600">${{ appt.amount }}</span>
          </div>
          <div class="col-span-1 flex justify-center">
            <span
              v-if="appt.isPaidOff"
              class="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center"
              title="Paid"
            >
              <font-awesome-icon :icon="['fas', 'check']" class="text-[7px] text-emerald-600" />
            </span>
            <span
              v-else-if="appt.isPastDue"
              class="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center"
              title="Past Due"
            >
              <font-awesome-icon :icon="['fas', 'exclamation']" class="text-[7px] text-red-600" />
            </span>
            <span
              v-else
              class="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center"
              title="Pending"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            </span>
          </div>
          <div class="col-span-1 flex justify-center">
            <div v-if="appt.notes" class="relative group">
              <font-awesome-icon
                :icon="['fas', 'sticky-note']"
                class="text-[9px] text-gray-300 hover:text-rose-500 cursor-pointer transition-colors"
              />
              <div class="hidden group-hover:block absolute z-30 top-1/2 right-full -translate-y-1/2 mr-2 w-48 p-2.5 bg-gray-800 text-white text-[10px] rounded-lg shadow-lg leading-relaxed whitespace-normal">
                {{ appt.notes }}
                <div class="absolute top-1/2 left-full w-2 h-2 bg-gray-800 rotate-45 -translate-y-1/2 -ml-1"></div>
              </div>
            </div>
            <span v-else class="text-[9px] text-gray-200">-</span>
          </div>
        </div>
      </div>

      <div v-else class="flex items-center justify-center py-6 text-gray-300">
        <p class="text-[10px]">No {{ title }} appointments</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faStickyNote, faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons';

library.add(faStickyNote, faCheck, faExclamation);

export default defineComponent({
  name: 'O5AppointmentTable',
  components: { FontAwesomeIcon },
  props: {
    title: { type: String, required: true },
    appointments: { type: Array as PropType<Appointment[]>, required: true },
    headerColor: { type: String, default: 'text-gray-600' },
    headerBorder: { type: String, default: 'border-gray-200' },
  },
});
</script>
