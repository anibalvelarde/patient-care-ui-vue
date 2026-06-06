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
        :disabled="action.disabled"
        :title="action.disabled ? 'Coming soon' : action.label"
        :class="[
          'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          action.disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200'
            : action.primary
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
              : 'text-gray-500 border border-gray-200 hover:bg-gray-50',
        ]"
        @click="handleAction(action)"
      >
        <font-awesome-icon :icon="['fas', action.icon]" />
        {{ action.label }}
      </button>

      <!-- Notification bell -->
      <button class="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <font-awesome-icon :icon="['fas', 'bell']" class="text-lg" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <!-- User + logout -->
      <div class="flex items-center gap-2 pl-2 border-l border-gray-200">
        <div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center" :title="fullName">
          <span class="text-xs font-semibold text-violet-600">{{ initials }}</span>
        </div>
        <span class="hidden lg:block text-xs font-medium text-gray-600 max-w-[10rem] truncate">{{ fullName }}</span>
        <button
          @click="onLogout"
          title="Sign out"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <font-awesome-icon :icon="['fas', 'right-from-bracket']" />
          <span class="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile action bar -->
  <div class="sm:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
    <button
      v-for="action in quickActions"
      :key="action.label"
      :disabled="action.disabled"
      :title="action.disabled ? 'Coming soon' : action.label"
      :class="[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
        action.disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200'
          : action.primary
            ? 'bg-violet-600 text-white hover:bg-violet-700'
            : 'text-gray-500 border border-gray-200 hover:bg-gray-50',
      ]"
      @click="handleAction(action)"
    >
      <font-awesome-icon :icon="['fas', action.icon]" />
      {{ action.label }}
    </button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCalendarPlus,
  faUserPlus,
  faMoneyBill,
  faBell,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../../stores/auth';

library.add(faCalendarPlus, faUserPlus, faMoneyBill, faBell, faRightFromBracket);

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

    const router = useRouter();
    const auth = useAuthStore();

    const fullName = computed(() => auth.fullName);
    const initials = computed(() => {
      const tokens = auth.fullName.split(/[\s,]+/).filter(Boolean);
      const letters = tokens.map((t) => t[0]).filter((c) => /[a-zA-Z]/.test(c));
      return (letters[0] ?? '') + (letters[1] ?? '') || '?';
    });

    const onLogout = () => {
      auth.logout();
      router.push({ name: 'login' });
    };

    const quickActions = [
      { label: 'New Appointment', icon: 'calendar-plus', primary: true, disabled: true },
      { label: 'Add Patient', icon: 'user-plus', primary: false, disabled: false },
      { label: 'Payment', icon: 'money-bill', primary: false, disabled: true },
    ];

    const handleAction = (action: { label: string; disabled: boolean }) => {
      if (action.disabled) return;
      if (action.label === 'Add Patient') {
        router.push('/patients');
      }
    };

    return { greeting, todayFormatted, quickActions, handleAction, fullName, initials, onLogout };
  },
});
</script>
