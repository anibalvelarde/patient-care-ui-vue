<template>
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <button
          v-for="action in actions"
          :key="action.label"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            action.primary
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
          ]"
        >
          <font-awesome-icon :icon="['fas', action.icon]" class="text-xs" />
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faHospitalUser,
  faCalendarAlt,
  faFileInvoiceDollar,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';

library.add(faHospitalUser, faCalendarAlt, faFileInvoiceDollar, faChartLine);

export default defineComponent({
  name: 'O1ActionBar',
  components: { FontAwesomeIcon },
  setup() {
    const actions = [
      { label: 'New Appointment', icon: 'calendar-alt', primary: true },
      { label: 'Add Patient', icon: 'hospital-user', primary: false },
      { label: 'Receive Payment', icon: 'file-invoice-dollar', primary: false },
      { label: 'Reports', icon: 'chart-line', primary: false },
    ];

    return { actions };
  },
});
</script>
