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
      <component
        v-for="item in visibleNavItems"
        :key="item.label"
        :is="item.to.startsWith('/') ? 'router-link' : 'button'"
        :to="item.to.startsWith('/') ? item.to : undefined"
        :class="[
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
          isActive(item.to)
            ? 'bg-white/20 text-white'
            : 'text-violet-300 hover:bg-white/10 hover:text-white',
        ]"
        :title="item.title || item.label"
      >
        <font-awesome-icon :icon="['fas', item.icon]" class="text-lg" />
        <span class="text-[9px] mt-0.5 font-medium">{{ item.label }}</span>
      </component>
    </nav>

    <!-- Bottom -->
    <div class="flex flex-col items-center pb-6 space-y-2">
      <div class="w-10 border-t border-violet-800 mb-1"></div>
      <router-link
        v-if="isSystemAdmin"
        to="/admin"
        :class="[
          'w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150',
          isActive('/admin')
            ? 'bg-white/20 text-white'
            : 'text-violet-300 hover:bg-white/10 hover:text-white',
        ]"
        title="Admin"
      >
        <font-awesome-icon :icon="['fas', 'gear']" class="text-lg" />
        <span class="text-[9px] mt-0.5 font-medium">Admin</span>
      </router-link>
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
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
  faCalendarWeek,
  faMoneyBillTransfer,
} from '@fortawesome/free-solid-svg-icons';

library.add(faChartPie, faUsers, faUserMd, faHandHoldingHeart, faCalendarCheck, faCalendarWeek, faCreditCard, faFileAlt, faMoneyBillTransfer, faGear, faArrowLeft);

export default defineComponent({
  name: 'O2Sidebar',
  components: { FontAwesomeIcon },
  setup() {
    const route = useRoute();
    const { isSystemAdmin, hasClaim } = useClaims();

    // Each item is gated on its coarse page-access claim (WP-17C), mirroring the router guard.
    // SYSADMIN passes via the wildcard inside hasClaim; at the seeded roles the only hidden item is
    // Statements for FD (no Statements.View). Claims are generated constants so a typo fails vue-tsc.
    const navItems: Array<{ label: string; icon: string; to: string; title?: string; claim?: [string, string] }> = [
      { label: 'Dashboard', icon: 'chart-pie', to: '/', claim: ['Permission', Permissions.DashboardView] },
      { label: 'Patients', icon: 'users', to: '/patients', claim: ['Permission', Permissions.PatientsView] },
      { label: 'Therapists', icon: 'user-md', to: '/therapists', claim: ['Permission', Permissions.TherapistsView] },
      { label: 'Caretakers', icon: 'hand-holding-heart', to: '/caretakers', claim: ['Permission', Permissions.CaretakersView] },
      { label: 'Appts', icon: 'calendar-check', to: '/appointments', title: 'Appointments', claim: ['Permission', Permissions.AppointmentsView] },
      { label: 'Schedule', icon: 'calendar-week', to: '/schedule', title: 'Weekly Schedule', claim: ['Permission', Permissions.ScheduleView] },
      { label: 'Billing', icon: 'credit-card', to: '/payments', claim: ['Permission', Permissions.PaymentsView] },
      { label: 'Statements', icon: 'file-alt', to: '/statements', claim: ['Permission', Permissions.StatementsView] },
      { label: 'Payroll', icon: 'money-bill-transfer', to: '/service-payments', title: 'Service Payments', claim: ['Permission', Permissions.ServicePaymentsView] },
    ];

    const visibleNavItems = computed(() =>
      navItems.filter((item) => !item.claim || hasClaim(item.claim[0], item.claim[1])),
    );

    const isActive = (to: string) => {
      if (to === '#') return false;
      return route.path === to;
    };

    return { visibleNavItems, isActive, isSystemAdmin };
  },
});
</script>
