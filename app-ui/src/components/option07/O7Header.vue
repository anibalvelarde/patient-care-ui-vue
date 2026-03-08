<template>
  <header class="bg-[#FFFBF5] border-b border-amber-100 px-6 py-4 flex-shrink-0">
    <div class="max-w-3xl mx-auto flex items-center justify-between">
      <!-- Left: Brand -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
          <span class="text-[10px] font-bold text-white">NC</span>
        </div>
        <div>
          <h1 class="text-sm font-bold text-stone-800">Neurocorp Therapy Center</h1>
          <p class="text-[10px] text-stone-400">Patient Care</p>
        </div>
      </div>

      <!-- Right: role + back -->
      <div class="flex items-center gap-3">
        <span class="text-[10px] text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full font-medium">Front Desk</span>
        <router-link
          to="/"
          class="px-2.5 py-1 rounded-full text-[10px] font-medium text-stone-400 border border-stone-200 hover:border-amber-300 hover:text-amber-700 transition-colors"
        >
          <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-0.5" />
          Options
        </router-link>
      </div>
    </div>

    <!-- Date nav row -->
    <div class="max-w-3xl mx-auto mt-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          @click="prevDay"
          class="p-1.5 rounded-full text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="text-lg font-semibold text-stone-700 min-w-[240px] text-center">
          {{ formattedDate }}
        </h2>
        <button
          @click="nextDay"
          class="p-1.5 rounded-full text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="goToday"
          class="px-3 py-1.5 rounded-full text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          Today
        </button>
        <JumpToDate
          buttonClass="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
          panelClass="bg-[#FFFBF5] border-amber-200"
          labelClass="text-stone-400"
          selectClass="bg-white border-amber-200 text-stone-800 focus:ring-amber-400"
          jumpButtonClass="bg-amber-500 text-white hover:bg-amber-600"
          cancelButtonClass="text-stone-500 hover:bg-stone-100"
          @jump="(date: string) => $emit('date-selected', date)"
        />
      </div>
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
  name: 'O7Header',
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
        weekday: 'long',
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
