<template>
  <nav class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Configuration group -->
    <div>
      <button
        class="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        @click="configOpen = !configOpen"
      >
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuration</span>
        <svg
          class="w-4 h-4 text-slate-400 transition-transform duration-200"
          :class="{ 'rotate-180': configOpen }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        class="overflow-hidden transition-all duration-200"
        :class="configOpen ? 'max-h-40' : 'max-h-0'"
      >
        <button
          class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors border-b border-slate-50"
          :class="activeSection === 'sites'
            ? 'bg-violet-50 text-violet-700 font-medium border-l-2 border-l-violet-600'
            : 'text-slate-600 hover:bg-slate-50'"
          @click="$emit('select', 'sites')"
        >
          <svg class="w-4 h-4" :class="activeSection === 'sites' ? 'text-violet-500' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Sites
        </button>
      </div>
    </div>

    <!-- Reference Data group -->
    <div>
      <button
        class="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        @click="refdataOpen = !refdataOpen"
      >
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference Data</span>
        <svg
          class="w-4 h-4 text-slate-400 transition-transform duration-200"
          :class="{ 'rotate-180': refdataOpen }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        class="overflow-hidden transition-all duration-200"
        :class="refdataOpen ? 'max-h-60' : 'max-h-0'"
      >
        <button
          v-for="item in refDataItems"
          :key="item.key"
          class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors border-b border-slate-50"
          :class="activeSection === item.key
            ? 'bg-violet-50 text-violet-700 font-medium border-l-2 border-l-violet-600'
            : 'text-slate-600 hover:bg-slate-50'"
          @click="$emit('select', item.key)"
        >
          <svg class="w-4 h-4" :class="activeSection === item.key ? 'text-violet-500' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- Security group (placeholder) -->
    <div>
      <button
        class="w-full px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        @click="securityOpen = !securityOpen"
      >
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security</span>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Coming Soon</span>
          <svg
            class="w-4 h-4 text-slate-300 transition-transform duration-200"
            :class="{ 'rotate-180': securityOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        class="overflow-hidden transition-all duration-200"
        :class="securityOpen ? 'max-h-20' : 'max-h-0'"
      >
        <div class="px-4 py-3 text-xs text-slate-400 italic">
          OAuth settings, RBAC roles, and audit logs will appear here.
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AdminAccordionNav',
  props: {
    activeSection: { type: String, required: true },
  },
  emits: ['select'],
  setup() {
    const configOpen = ref(true);
    const refdataOpen = ref(true);
    const securityOpen = ref(false);

    const refDataItems = [
      {
        key: 'appointment-statuses',
        label: 'Appt. Statuses',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        key: 'payment-types',
        label: 'Payment Types',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        key: 'role-types',
        label: 'Role Types',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      },
      {
        key: 'specialty-types',
        label: 'Specialty Types',
        icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      },
    ];

    return { configOpen, refdataOpen, securityOpen, refDataItems };
  },
});
</script>
