<template>
  <header class="bg-slate-900 border-b border-slate-700/50 px-6 h-14 flex items-center justify-between">
    <!-- Left: Brand + Nav -->
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
          <span class="text-[10px] font-bold text-slate-900">NC</span>
        </div>
        <span class="text-sm font-semibold text-white tracking-wide hidden sm:inline">Neurocorp</span>
      </div>

      <nav class="hidden md:flex items-center gap-1">
        <button
          v-for="item in navItems"
          :key="item.label"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            item.active
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
          ]"
        >
          <font-awesome-icon :icon="['fas', item.icon]" class="mr-1.5" />
          {{ item.label }}
        </button>
      </nav>
    </div>

    <!-- Right: Actions + User -->
    <div class="flex items-center gap-3">
      <button class="relative p-2 text-slate-400 hover:text-white transition-colors">
        <font-awesome-icon :icon="['fas', 'bell']" />
        <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
      </button>

      <div class="h-5 w-px bg-slate-700"></div>

      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center ring-2 ring-cyan-500/30">
          <span class="text-[10px] font-semibold text-cyan-400">FD</span>
        </div>
        <div class="hidden sm:block">
          <p class="text-xs font-medium text-slate-200 leading-tight">Front Desk</p>
          <p class="text-[10px] text-slate-500 leading-tight">{{ todayShort }}</p>
        </div>
      </div>

      <router-link
        to="/"
        class="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-200 transition-colors"
      >
        <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-1" />
        Options
      </router-link>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faChartPie,
  faCalendarCheck,
  faUsers,
  faFileInvoiceDollar,
  faBell,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

library.add(faChartPie, faCalendarCheck, faUsers, faFileInvoiceDollar, faBell, faArrowLeft);

export default defineComponent({
  name: 'O3TopBar',
  components: { FontAwesomeIcon },
  setup() {
    const todayShort = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const navItems = [
      { label: 'Dashboard', icon: 'chart-pie', active: true },
      { label: 'Schedule', icon: 'calendar-check', active: false },
      { label: 'Patients', icon: 'users', active: false },
      { label: 'Billing', icon: 'file-invoice-dollar', active: false },
    ];

    return { todayShort, navItems };
  },
});
</script>
