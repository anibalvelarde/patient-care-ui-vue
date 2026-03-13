<template>
  <aside class="hidden md:flex flex-col w-20 bg-violet-900 text-white">
    <!-- Brand -->
    <div class="flex items-center justify-center h-16 border-b border-violet-800">
      <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
        <span class="text-sm font-bold text-violet-200">NC</span>
      </div>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 flex flex-col items-center py-6 space-y-2">
      <button
        v-for="item in navItems"
        :key="item.label"
        :class="[
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
          item.active
            ? 'bg-white/20 text-white'
            : 'text-violet-300 hover:bg-white/10 hover:text-white',
        ]"
        :title="item.label"
      >
        <font-awesome-icon :icon="['fas', item.icon]" class="text-lg" />
        <span class="text-[9px] mt-0.5 font-medium">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Bottom -->
    <div class="flex flex-col items-center pb-6 space-y-2">
      <router-link
        to="/design-options"
        class="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-violet-300 hover:bg-white/10 hover:text-white transition-all duration-150"
        title="Back to Options"
      >
        <font-awesome-icon :icon="['fas', 'arrow-left']" class="text-lg" />
        <span class="text-[9px] mt-0.5 font-medium">Back</span>
      </router-link>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChartPie,
  faUsers,
  faUserMd,
  faCalendarCheck,
  faCreditCard,
  faFileAlt,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

library.add(faChartPie, faUsers, faUserMd, faCalendarCheck, faCreditCard, faFileAlt, faArrowLeft);

export default defineComponent({
  name: 'O2Sidebar',
  components: { FontAwesomeIcon },
  setup() {
    const navItems = [
      { label: 'Dashboard', icon: 'chart-pie', active: true },
      { label: 'Patients', icon: 'users', active: false },
      { label: 'Therapists', icon: 'user-md', active: false },
      { label: 'Schedule', icon: 'calendar-check', active: false },
      { label: 'Billing', icon: 'credit-card', active: false },
      { label: 'Reports', icon: 'file-alt', active: false },
    ];

    return { navItems };
  },
});
</script>
