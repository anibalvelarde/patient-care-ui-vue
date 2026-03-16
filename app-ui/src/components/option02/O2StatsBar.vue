<template>
  <div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        :class="[
          'bg-white rounded-xl border px-5 py-4 flex items-center gap-4',
          stat.borderClass,
        ]"
      >
        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', stat.iconBg]">
          <font-awesome-icon :icon="['fas', stat.icon]" :class="stat.iconColor" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ stat.value }}</p>
          <p class="text-xs text-gray-400">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="pastDueFinancials.count > 0"
      class="mt-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-red-500" />
        <span class="text-xs font-semibold text-red-700 uppercase tracking-wider">Past Due Summary</span>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-right">
          <p class="text-[10px] text-gray-400 uppercase">Billed</p>
          <p class="text-sm font-semibold text-gray-700">{{ formatCurrency(pastDueFinancials.totalAmount) }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 uppercase">Discount</p>
          <p class="text-sm font-semibold text-gray-700">{{ formatCurrency(pastDueFinancials.totalDiscount) }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 uppercase">Paid</p>
          <p class="text-sm font-semibold text-gray-700">{{ formatCurrency(pastDueFinancials.totalPaid) }}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 uppercase">Due</p>
          <p class="text-sm font-bold text-red-700">{{ formatCurrency(pastDueFinancials.totalDue) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { formatCurrency } from '../../utils/formatCurrency';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCalendarDay,
  faHourglassHalf,
  faExclamationTriangle,
  faCheckCircle,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';

library.add(faCalendarDay, faHourglassHalf, faExclamationTriangle, faCheckCircle, faDollarSign);

export default defineComponent({
  name: 'O2StatsBar',
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
          label: "Today's Appointments",
          value: total,
          icon: 'calendar-day',
          iconBg: 'bg-violet-100',
          iconColor: 'text-violet-600',
          borderClass: 'border-gray-200',
        },
        {
          label: 'Paid Off',
          value: paid,
          icon: 'check-circle',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderClass: 'border-gray-200',
        },
        {
          label: 'Pending Payment',
          value: pending < 0 ? 0 : pending,
          icon: 'hourglass-half',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          borderClass: 'border-gray-200',
        },
        {
          label: 'Past Due',
          value: pastDue,
          icon: 'exclamation-triangle',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderClass: pastDue > 0 ? 'border-red-200' : 'border-gray-200',
        },
      ];
    });

    const pastDueFinancials = computed(() => {
      const pastDue = props.appointments.filter((a) => a.isPastDue);
      return {
        count: pastDue.length,
        totalAmount: pastDue.reduce((sum, a) => sum + a.amount, 0),
        totalDiscount: pastDue.reduce((sum, a) => sum + a.discount, 0),
        totalPaid: pastDue.reduce((sum, a) => sum + a.amountPaid, 0),
        totalDue: pastDue.reduce((sum, a) => sum + a.amountDue, 0),
      };
    });

    return { stats, pastDueFinancials, formatCurrency };
  },
});
</script>
