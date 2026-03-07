<template>
  <div v-if="pastDueAppointments.length > 0" class="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-3 flex-shrink-0">
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="text-[10px] text-red-500" />
      <span class="text-[10px] font-bold text-red-700 uppercase tracking-wider">Past Due Alerts</span>
    </div>
    <div class="flex-1 flex items-center gap-2 overflow-x-auto">
      <span
        v-for="appt in pastDueAppointments"
        :key="appt.sessionId"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 rounded-full text-[10px] text-red-700 font-medium whitespace-nowrap flex-shrink-0"
      >
        {{ appt.patient }}
        <span class="text-red-400">&middot;</span>
        ${{ appt.amountDue.toFixed(2) }} due
      </span>
    </div>
  </div>
  <div v-else class="bg-emerald-50 border-t border-emerald-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
    <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[10px] text-emerald-500" />
    <span class="text-[10px] font-medium text-emerald-700">No past due accounts for this date</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

library.add(faExclamationTriangle, faCheckCircle);

export default defineComponent({
  name: 'O5AlertStrip',
  components: { FontAwesomeIcon },
  props: {
    appointments: {
      type: Array as PropType<Appointment[]>,
      required: true,
    },
  },
  setup(props) {
    const pastDueAppointments = computed(() =>
      props.appointments.filter((a) => a.isPastDue)
    );
    return { pastDueAppointments };
  },
});
</script>
