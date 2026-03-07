<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div
      v-for="stat in stats"
      :key="stat.label"
      :class="[
        'bg-slate-800/50 border rounded-xl px-4 py-3 flex items-center gap-3',
        stat.borderClass,
      ]"
    >
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', stat.iconBg]">
        <font-awesome-icon :icon="['fas', stat.icon]" :class="['text-sm', stat.iconColor]" />
      </div>
      <div>
        <p class="text-xl font-bold text-white">{{ stat.value }}</p>
        <p class="text-[10px] text-slate-400">{{ stat.label }}</p>
      </div>
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
  faHourglassHalf,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';

library.add(faCalendarDay, faHourglassHalf, faExclamationTriangle, faCheckCircle);

export default defineComponent({
  name: 'O3StatsBar',
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
      const pending = total - paid - pastDue;

      return [
        {
          label: 'Total Today',
          value: total,
          icon: 'calendar-day',
          iconBg: 'bg-cyan-500/15',
          iconColor: 'text-cyan-400',
          borderClass: 'border-slate-700/50',
        },
        {
          label: 'Paid Off',
          value: paid,
          icon: 'check-circle',
          iconBg: 'bg-emerald-500/15',
          iconColor: 'text-emerald-400',
          borderClass: 'border-slate-700/50',
        },
        {
          label: 'Pending',
          value: pending < 0 ? 0 : pending,
          icon: 'hourglass-half',
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-400',
          borderClass: 'border-slate-700/50',
        },
        {
          label: 'Past Due',
          value: pastDue,
          icon: 'exclamation-triangle',
          iconBg: 'bg-red-500/15',
          iconColor: 'text-red-400',
          borderClass: pastDue > 0 ? 'border-red-500/30' : 'border-slate-700/50',
        },
      ];
    });

    return { stats };
  },
});
</script>
