<template>
  <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">NC</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-slate-800 leading-tight">Neurocorp</h1>
            <p class="text-xs text-slate-400 leading-tight">Therapy Center</p>
          </div>
        </div>

        <!-- Desktop Nav Links -->
        <div class="hidden md:flex items-center space-x-1">
          <a
            v-for="item in navItems"
            :key="item.label"
            href="#"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              item.active
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
            ]"
          >
            {{ item.label }}
          </a>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <span class="hidden sm:inline-block text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Front Desk
          </span>
          <div class="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span class="text-xs font-medium text-slate-500">FD</span>
          </div>
        </div>

        <!-- Mobile menu button -->
        <button
          class="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
      <a
        v-for="item in navItems"
        :key="item.label"
        href="#"
        :class="[
          'block px-4 py-2 rounded-lg text-sm font-medium',
          item.active
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
        ]"
      >
        {{ item.label }}
      </a>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'O1Navbar',
  setup() {
    const mobileMenuOpen = ref(false);

    const navItems = [
      { label: 'Dashboard', active: true },
      { label: 'Patients', active: false },
      { label: 'Therapists', active: false },
      { label: 'Caretakers', active: false },
      { label: 'Reports', active: false },
    ];

    return { mobileMenuOpen, navItems };
  },
});
</script>
