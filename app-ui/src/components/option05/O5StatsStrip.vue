<template>
  <div class="flex items-center gap-3 flex-shrink-0">
    <div
      v-for="stat in stats"
      :key="stat.label"
      :class="['flex items-center gap-2 px-3 py-1.5 rounded-lg border', stat.borderClass, stat.bgClass]"
    >
      <font-awesome-icon :icon="['fas', stat.icon]" :class="['text-xs', stat.iconColor]" />
      <span class="text-xs font-bold text-gray-800">{{ stat.value }}</span>
      <span class="text-[10px] text-gray-400">{{ stat.label }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCalendarDay,
  faCheckCircle,
  faHourglassHalf,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

library.add(faCalendarDay, faCheckCircle, faHourglassHalf, faExclamationTriangle);

export default defineComponent({
  name: 'O5StatsStrip',
  components: { FontAwesomeIcon },
  props: {
    appointments: {
      type: Array as PropType<Appointment[]>,
      required: true,
    },
  },
  setup(props) {
    const stats = computed(() => {
      const total = props.appointments.length;
      const paid = props.appointments.filter((a) => a.isPaidOff).length;
      const pastDue = props.appointments.filter((a) => a.isPastDue).length;
      const pending = Math.max(0, total - paid - pastDue);

      return [
        { label: 'Total', value: total, icon: 'calendar-day', iconColor: 'text-rose-500', borderClass: 'border-gray-200', bgClass: 'bg-white' },
        { label: 'Paid', value: paid, icon: 'check-circle', iconColor: 'text-emerald-500', borderClass: 'border-gray-200', bgClass: 'bg-white' },
        { label: 'Pending', value: pending, icon: 'hourglass-half', iconColor: 'text-amber-500', borderClass: 'border-gray-200', bgClass: 'bg-white' },
        { label: 'Past Due', value: pastDue, icon: 'exclamation-triangle', iconColor: 'text-red-500', borderClass: pastDue > 0 ? 'border-red-200' : 'border-gray-200', bgClass: pastDue > 0 ? 'bg-red-50' : 'bg-white' },
      ];
    });

    return { stats };
  },
});
</script>
