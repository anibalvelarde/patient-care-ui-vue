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
      v-for="item in visibleNavItems"
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
    <div v-if="isSystemAdmin" class="border-t border-violet-800 my-1"></div>
    <router-link
      v-if="isSystemAdmin"
      to="/admin"
      :class="[
        'flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive('/admin')
          ? 'bg-white/20 text-white'
          : 'text-violet-300 hover:bg-white/10 hover:text-white',
      ]"
      @click="mobileOpen = false"
    >
      <font-awesome-icon :icon="['fas', 'gear']" class="w-5" />
      <span>Admin</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useClaims, Permissions } from '../../composables/useClaims';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChartPie,
  faUsers,
  faUserMd,
  faHandHoldingHeart,
  faCalendarCheck,
  faCreditCard,
  faFileAlt,
  faGear,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

library.add(faChartPie, faUsers, faUserMd, faHandHoldingHeart, faCalendarCheck, faCreditCard, faFileAlt, faGear, faArrowLeft);

export default defineComponent({
  name: 'O2MobileNav',
  components: { FontAwesomeIcon },
  setup() {
    const route = useRoute();
    const mobileOpen = ref(false);
    const { isSystemAdmin, hasClaim } = useClaims();

    // Each item gated on its coarse page-access claim (WP-17C), mirroring the sidebar + router guard.
    const navItems: Array<{ label: string; icon: string; to: string; claim?: [string, string] }> = [
      { label: 'Dashboard', icon: 'chart-pie', to: '/', claim: ['Permission', Permissions.DashboardView] },
      { label: 'Patients', icon: 'users', to: '/patients', claim: ['Permission', Permissions.PatientsView] },
      { label: 'Therapists', icon: 'user-md', to: '/therapists', claim: ['Permission', Permissions.TherapistsView] },
      { label: 'Caretakers', icon: 'hand-holding-heart', to: '/caretakers', claim: ['Permission', Permissions.CaretakersView] },
      { label: 'Schedule', icon: 'calendar-check', to: '/appointments', claim: ['Permission', Permissions.AppointmentsView] },
      { label: 'Billing', icon: 'credit-card', to: '/payments', claim: ['Permission', Permissions.PaymentsView] },
      { label: 'Statements', icon: 'file-alt', to: '/statements', claim: ['Permission', Permissions.StatementsView] },
    ];

    const visibleNavItems = computed(() =>
      navItems.filter((item) => !item.claim || hasClaim(item.claim[0], item.claim[1])),
    );

    const isActive = (to: string) => {
      if (to === '#') return false;
      return route.path === to;
    };

    return { visibleNavItems, isActive, mobileOpen, isSystemAdmin };
  },
});
</script>
