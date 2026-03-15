<template>
  <!-- Mobile top bar -->
  <div class="md:hidden bg-violet-900 text-white flex items-center justify-between px-4 h-14">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
        <span class="text-xs font-bold text-violet-200">NC</span>
      </div>
      <span class="text-sm font-semibold">Neurocorp</span>
    </div>
    <button
      class="p-2 rounded-lg text-violet-200 hover:bg-white/10"
      @click="mobileOpen = !mobileOpen"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          v-if="!mobileOpen"
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
        <path
          v-else
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- Mobile nav drawer -->
  <div v-if="mobileOpen" class="md:hidden bg-violet-900 text-white px-4 pb-4 space-y-1">
    <component
      v-for="item in navItems"
      :key="item.label"
      :is="item.to.startsWith('/') ? 'router-link' : 'button'"
      :to="item.to.startsWith('/') ? item.to : undefined"
      :class="[
        'flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive(item.to)
          ? 'bg-white/20 text-white'
          : 'text-violet-300 hover:bg-white/10 hover:text-white',
      ]"
      @click="mobileOpen = false"
    >
      <font-awesome-icon :icon="['fas', item.icon]" class="w-5" />
      <span>{{ item.label }}</span>
    </component>
    <router-link
      to="/design-options"
      class="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-violet-300 hover:bg-white/10 hover:text-white transition-colors"
      @click="mobileOpen = false"
    >
      <font-awesome-icon :icon="['fas', 'arrow-left']" class="w-5" />
      <span>Design Options</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';
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
  name: 'O2MobileNav',
  components: { FontAwesomeIcon },
  setup() {
    const route = useRoute();
    const mobileOpen = ref(false);

    const navItems = [
      { label: 'Dashboard', icon: 'chart-pie', to: '/' },
      { label: 'Patients', icon: 'users', to: '/patients' },
      { label: 'Therapists', icon: 'user-md', to: '#' },
      { label: 'Schedule', icon: 'calendar-check', to: '#' },
      { label: 'Billing', icon: 'credit-card', to: '#' },
      { label: 'Reports', icon: 'file-alt', to: '#' },
    ];

    const isActive = (to: string) => {
      if (to === '#') return false;
      return route.path === to;
    };

    return { navItems, isActive, mobileOpen };
  },
});
</script>
