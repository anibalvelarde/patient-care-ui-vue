<template>
  <header class="bg-white border-b border-slate-200 px-5 h-12 flex items-center justify-between flex-shrink-0">
    <!-- Left: Brand + Date -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <div class="w-6 h-6 bg-gradient-to-br from-slate-600 to-blue-600 rounded flex items-center justify-center">
          <span class="text-[8px] font-bold text-white">NC</span>
        </div>
        <span class="text-xs font-bold text-slate-800">Neurocorp</span>
      </div>

      <div class="h-4 w-px bg-slate-200"></div>

      <div class="flex items-center gap-1.5">
        <button
          @click="prevDay"
          class="p-0.5 rounded text-slate-400 hover:text-blue-600 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-xs font-semibold text-slate-700 min-w-[120px] text-center">
          {{ formattedDate }}
        </span>
        <button
          @click="nextDay"
          class="p-0.5 rounded text-slate-400 hover:text-blue-600 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          @click="goToday"
          class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          Today
        </button>
        <JumpToDate
          buttonClass="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
          jumpButtonClass="bg-blue-600 text-white hover:bg-blue-700"
          @jump="(date: string) => $emit('date-selected', date)"
        />
      </div>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-2">
      <span class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">Front Desk</span>
      <router-link
        to="/design-options"
        class="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-0.5" />
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
  name: 'O6Header',
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
        month: 'short',
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
