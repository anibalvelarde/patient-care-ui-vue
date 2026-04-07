<template>
  <div>
    <!-- Stat Tiles -->
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

    <!-- Financial Summary: Progress Banner -->
    <div v-if="appointments.length > 0" class="mt-3 bg-white border border-gray-200 rounded-xl px-5 py-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-violet-500" />
          <span class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Daily Financial Summary
          </span>
        </div>
        <span class="text-xs text-gray-400">{{ appointments.length }} Sessions</span>
      </div>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex h-4 rounded-full overflow-hidden bg-gray-100">
          <div
            class="bg-green-500 transition-all duration-500 flex items-center justify-center"
            :style="{ width: paidPercent + '%' }"
          >
            <span v-if="paidPercent >= 15" class="text-[9px] font-bold text-white">
              {{ paidPercent }}%
            </span>
          </div>
          <div
            class="bg-red-400 transition-all duration-500 flex items-center justify-center"
            :style="{ width: unpaidPercent + '%' }"
          >
            <span v-if="unpaidPercent >= 15" class="text-[9px] font-bold text-white">
              {{ unpaidPercent }}%
            </span>
          </div>
        </div>
        <div class="flex justify-between mt-1 text-[10px]">
          <span class="text-green-600 font-medium">Settled {{ paidPercent }}%</span>
          <span class="text-red-600 font-medium">Past Due {{ unpaidPercent }}%</span>
        </div>
      </div>

      <!-- Two-Column Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Settled Column -->
        <div class="bg-green-50 rounded-lg px-4 py-3">
          <p class="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-2">
            Settled ({{ settledFinancials.count }})
          </p>
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Billed</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(settledFinancials.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Discount</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(settledFinancials.totalDiscount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Paid</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(settledFinancials.totalPaid) }}</span>
            </div>
            <div class="border-t border-green-200 pt-1.5 flex justify-between text-xs">
              <span class="text-green-700 font-semibold">Collected</span>
              <span class="text-green-700 font-bold">{{ formatCurrency(settledFinancials.totalPaid) }}</span>
            </div>
          </div>
          <p v-if="settledFinancials.totalProvider > 0" class="mt-2 text-[10px] text-gray-400 italic">
            Includes {{ formatCurrency(settledFinancials.totalProvider) }} provider fees
            ({{ settledFinancials.providerPercent }}% of collected)
          </p>
        </div>

        <!-- Past Due Column -->
        <div class="bg-red-50 rounded-lg px-4 py-3">
          <p class="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-2">
            Past Due ({{ pastDueFinancials.count }})
          </p>
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Billed</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(pastDueFinancials.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Discount</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(pastDueFinancials.totalDiscount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Paid</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(pastDueFinancials.totalPaid) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Due</span>
              <span class="text-gray-700 font-medium">{{ formatCurrency(pastDueFinancials.totalDue) }}</span>
            </div>
            <div class="border-t border-red-200 pt-1.5 flex justify-between text-xs">
              <span class="text-red-700 font-semibold">Outstanding</span>
              <span class="text-red-700 font-bold">{{ formatCurrency(pastDueFinancials.totalDue) }}</span>
            </div>
          </div>
          <p v-if="pastDueFinancials.totalProvider > 0" class="mt-2 text-[10px] text-gray-400 italic">
            Includes {{ formatCurrency(pastDueFinancials.totalProvider) }} provider fees
            ({{ pastDueFinancials.providerPercent }}% of outstanding)
          </p>
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
      const totalDue = pastDue.reduce((sum, a) => sum + a.amountDue, 0);
      const totalProvider = pastDue.reduce((sum, a) => sum + a.providerAmount, 0);
      return {
        count: pastDue.length,
        totalAmount: pastDue.reduce((sum, a) => sum + a.amount, 0),
        totalDiscount: pastDue.reduce((sum, a) => sum + a.discount, 0),
        totalPaid: pastDue.reduce((sum, a) => sum + a.amountPaid, 0),
        totalDue,
        totalProvider,
        providerPercent: totalDue > 0 ? Math.round((totalProvider / totalDue) * 100) : 0,
      };
    });

    const settledFinancials = computed(() => {
      const settled = props.appointments.filter((a) => a.isPaidOff);
      const totalPaid = settled.reduce((sum, a) => sum + a.amountPaid, 0);
      const totalProvider = settled.reduce((sum, a) => sum + a.providerAmount, 0);
      return {
        count: settled.length,
        totalAmount: settled.reduce((sum, a) => sum + a.amount, 0),
        totalDiscount: settled.reduce((sum, a) => sum + a.discount, 0),
        totalPaid,
        totalDue: settled.reduce((sum, a) => sum + a.amountDue, 0),
        totalProvider,
        providerPercent: totalPaid > 0 ? Math.round((totalProvider / totalPaid) * 100) : 0,
      };
    });

    const paidPercent = computed(() => {
      const total = props.appointments.length;
      if (total === 0) return 0;
      return Math.round((settledFinancials.value.count / total) * 100);
    });

    const unpaidPercent = computed(() => {
      const total = props.appointments.length;
      if (total === 0) return 0;
      return Math.round((pastDueFinancials.value.count / total) * 100);
    });

    return {
      stats,
      pastDueFinancials,
      settledFinancials,
      paidPercent,
      unpaidPercent,
      formatCurrency,
    };
  },
});
</script>
