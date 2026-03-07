<template>
  <header class="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">
    <!-- Left: Greeting -->
    <div>
      <h1 class="text-lg font-semibold text-gray-800">
        {{ greeting }}, <span class="text-violet-600">Front Desk</span>
      </h1>
      <p class="text-xs text-gray-400">{{ todayFormatted }}</p>
    </div>

    <!-- Right: Actions + Avatar -->
    <div class="flex items-center gap-3">
      <button
        v-for="action in quickActions"
        :key="action.label"
        :class="[
          'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          action.primary
            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
            : 'text-gray-500 border border-gray-200 hover:bg-gray-50',
        ]"
      >
        <font-awesome-icon :icon="['fas', action.icon]" />
        {{ action.label }}
      </button>

      <!-- Notification bell -->
      <button class="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <font-awesome-icon :icon="['fas', 'bell']" class="text-lg" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <!-- Avatar -->
      <div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
        <span class="text-xs font-semibold text-violet-600">FD</span>
      </div>
    </div>
  </header>

  <!-- Mobile action bar -->
  <div class="sm:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
    <button
      v-for="action in quickActions"
      :key="action.label"
      :class="[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
        action.primary
          ? 'bg-violet-600 text-white hover:bg-violet-700'
          : 'text-gray-500 border border-gray-200 hover:bg-gray-50',
      ]"
    >
      <font-awesome-icon :icon="['fas', action.icon]" />
      {{ action.label }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCalendarPlus,
  faUserPlus,
  faMoneyBill,
  faBell,
} from '@fortawesome/free-solid-svg-icons';

library.add(faCalendarPlus, faUserPlus, faMoneyBill, faBell);

export default defineComponent({
  name: 'O2Header',
  components: { FontAwesomeIcon },
  setup() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const todayFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const quickActions = [
      { label: 'New Appointment', icon: 'calendar-plus', primary: true },
      { label: 'Add Patient', icon: 'user-plus', primary: false },
      { label: 'Payment', icon: 'money-bill', primary: false },
    ];

    return { greeting, todayFormatted, quickActions };
  },
});
</script>
