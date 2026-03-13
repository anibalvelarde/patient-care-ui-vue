<template>
  <header class="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
    <!-- Left: Brand + Date picker -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-[10px] font-bold text-white">NC</span>
        </div>
        <span class="text-sm font-semibold text-gray-800 hidden sm:inline">Neurocorp</span>
      </div>

      <div class="h-5 w-px bg-gray-200"></div>

      <!-- Inline date nav -->
      <div class="flex items-center gap-2">
        <button
          @click="prevDay"
          class="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-gray-700 min-w-[140px] text-center">
          {{ formattedDate }}
        </span>
        <button
          @click="nextDay"
          class="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          @click="goToday"
          class="ml-1 px-2 py-1 rounded text-[10px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          Today
        </button>
        <JumpToDate
          buttonClass="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
          jumpButtonClass="bg-indigo-600 text-white hover:bg-indigo-700"
          @jump="(date: string) => $emit('date-selected', date)"
        />
      </div>
    </div>

    <!-- Right: Role + Back -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
          <span class="text-[10px] font-semibold text-indigo-600">FD</span>
        </div>
        <span class="text-xs text-gray-500 hidden sm:inline">Front Desk</span>
      </div>

      <router-link
        to="/design-options"
        class="px-2.5 py-1 rounded-lg text-[10px] font-medium text-gray-400 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
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
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import JumpToDate from '../shared/JumpToDate.vue';

library.add(faArrowLeft);

export default defineComponent({
  name: 'O4TopBar',
  components: { FontAwesomeIcon, JumpToDate },
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-selected'],
  computed: {
    formattedDate(): string {
      const d = new Date(this.selectedDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    },
  },
  methods: {
    prevDay() {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() - 1);
      this.$emit('date-selected', d.toLocaleDateString('en-US'));
    },
    nextDay() {
      const d = new Date(this.selectedDate);
      d.setDate(d.getDate() + 1);
      this.$emit('date-selected', d.toLocaleDateString('en-US'));
    },
    goToday() {
      this.$emit('date-selected', new Date().toLocaleDateString('en-US'));
    },
  },
});
</script>
