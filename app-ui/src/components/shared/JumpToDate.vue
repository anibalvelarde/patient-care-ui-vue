<template>
  <div class="relative">
    <!-- Trigger button -->
    <button
      @click="toggleOpen"
      :class="[
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
        buttonClass,
      ]"
      title="Jump to a specific date"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span>Jump</span>
    </button>

    <!-- Dropdown overlay -->
    <div
      v-if="isOpen"
      :class="[
        'absolute z-40 mt-1 p-3 rounded-xl shadow-xl border w-56',
        panelClass,
      ]"
      :style="{ [alignRight ? 'right' : 'left']: '0' }"
    >
      <!-- Month selector -->
      <label :class="['block text-[10px] font-semibold uppercase tracking-wider mb-1', labelClass]">Month</label>
      <select
        v-model="jumpMonth"
        :class="[
          'w-full px-2 py-1.5 rounded-lg text-sm font-medium border mb-3 focus:outline-none focus:ring-2',
          selectClass,
        ]"
      >
        <option v-for="(m, i) in months" :key="i" :value="i">{{ m }}</option>
      </select>

      <!-- Year selector -->
      <label :class="['block text-[10px] font-semibold uppercase tracking-wider mb-1', labelClass]">Year</label>
      <select
        v-model="jumpYear"
        :class="[
          'w-full px-2 py-1.5 rounded-lg text-sm font-medium border mb-3 focus:outline-none focus:ring-2',
          selectClass,
        ]"
      >
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>

      <!-- Day selector -->
      <label :class="['block text-[10px] font-semibold uppercase tracking-wider mb-1', labelClass]">Day</label>
      <select
        v-model="jumpDay"
        :class="[
          'w-full px-2 py-1.5 rounded-lg text-sm font-medium border mb-3 focus:outline-none focus:ring-2',
          selectClass,
        ]"
      >
        <option v-for="d in daysInSelectedMonth" :key="d" :value="d">{{ d }}</option>
      </select>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          @click="doJump"
          :class="[
            'flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            jumpButtonClass,
          ]"
        >
          Go
        </button>
        <button
          @click="isOpen = false"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            cancelButtonClass,
          ]"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Click-away backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-30" @click="isOpen = false"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';

export default defineComponent({
  name: 'JumpToDate',
  props: {
    alignRight: { type: Boolean, default: false },
    // Theming props — each option passes its own colors
    buttonClass: {
      type: String,
      default: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200',
    },
    panelClass: {
      type: String,
      default: 'bg-white border-gray-200',
    },
    labelClass: {
      type: String,
      default: 'text-gray-400',
    },
    selectClass: {
      type: String,
      default: 'bg-white border-gray-200 text-gray-800 focus:ring-blue-400',
    },
    jumpButtonClass: {
      type: String,
      default: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    cancelButtonClass: {
      type: String,
      default: 'text-gray-500 hover:bg-gray-100',
    },
  },
  emits: ['jump'],
  setup(_, { emit }) {
    const isOpen = ref(false);
    const now = new Date();
    const jumpMonth = ref(now.getMonth());
    const jumpYear = ref(now.getFullYear());
    const jumpDay = ref(now.getDate());

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const years = computed(() => {
      const current = new Date().getFullYear();
      const result = [];
      for (let y = current - 5; y <= current + 2; y++) {
        result.push(y);
      }
      return result;
    });

    const daysInSelectedMonth = computed(() => {
      return new Date(jumpYear.value, jumpMonth.value + 1, 0).getDate();
    });

    // Clamp day if month changes and current day exceeds new month's days
    watch([jumpMonth, jumpYear], () => {
      if (jumpDay.value > daysInSelectedMonth.value) {
        jumpDay.value = daysInSelectedMonth.value;
      }
    });

    const toggleOpen = () => {
      isOpen.value = !isOpen.value;
    };

    const doJump = () => {
      const d = new Date(jumpYear.value, jumpMonth.value, jumpDay.value);
      emit('jump', d.toLocaleDateString('en-US'));
      isOpen.value = false;
    };

    return {
      isOpen,
      jumpMonth,
      jumpYear,
      jumpDay,
      months,
      years,
      daysInSelectedMonth,
      toggleOpen,
      doJump,
    };
  },
});
</script>
