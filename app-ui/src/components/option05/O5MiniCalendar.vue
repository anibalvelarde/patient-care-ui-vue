<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
      <button @click="prevMonth" class="p-0.5 text-gray-400 hover:text-rose-500 transition-colors">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span class="text-[10px] font-semibold text-gray-600">{{ currentMonthLabel }}</span>
      <button @click="nextMonth" class="p-0.5 text-gray-400 hover:text-rose-500 transition-colors">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Day labels -->
    <div class="grid grid-cols-7 gap-0 text-center px-2 pt-1.5">
      <span v-for="d in ['M','T','W','T','F','S','S']" :key="d" class="text-[8px] font-semibold text-gray-400 py-0.5">
        {{ d }}
      </span>
    </div>

    <!-- Days grid -->
    <div class="grid grid-cols-7 gap-0 text-center px-2 pb-2 flex-1">
      <span v-for="n in monthStartOffset" :key="'o-' + n" class="py-0.5"></span>
      <button
        v-for="day in monthDays"
        :key="day.date"
        @click="selectDay(day.date)"
        :class="[
          'text-[10px] py-1 rounded transition-all',
          selectedDate === day.date
            ? 'bg-rose-500 text-white font-bold'
            : isToday(day.date)
              ? 'bg-rose-100 text-rose-600 font-semibold'
              : 'text-gray-600 hover:bg-gray-100',
        ]"
      >
        {{ day.dayNum }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'O5MiniCalendar',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-selected'],
  setup(props, { emit }) {
    const today = new Date();
    const viewMonth = ref(today.getMonth());
    const viewYear = ref(today.getFullYear());

    const currentMonthLabel = computed(() => {
      const d = new Date(viewYear.value, viewMonth.value, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const monthStartOffset = computed(() => {
      const first = new Date(viewYear.value, viewMonth.value, 1);
      const dow = first.getDay();
      return dow === 0 ? 6 : dow - 1;
    });

    const monthDays = computed(() => {
      const days = [];
      const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(viewYear.value, viewMonth.value, i);
        days.push({ dayNum: i, date: d.toLocaleDateString('en-US') });
      }
      return days;
    });

    const selectDay = (date: string) => emit('date-selected', date);
    const isToday = (date: string) => date === today.toLocaleDateString('en-US');

    const prevMonth = () => {
      if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
      else { viewMonth.value--; }
    };
    const nextMonth = () => {
      if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
      else { viewMonth.value++; }
    };

    return { currentMonthLabel, monthStartOffset, monthDays, selectDay, isToday, prevMonth, nextMonth };
  },
});
</script>
