<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <!-- Calendar Header -->
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-700">Schedule</h2>
      <div class="flex items-center gap-1">
        <button
          @click="prevMonth"
          class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Previous month"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-slate-600 min-w-[120px] text-center">
          {{ currentMonthLabel }}
        </span>
        <button
          @click="nextMonth"
          class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Next month"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Week Navigation -->
    <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
      <button
        @click="prevWeek"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        &larr; Prev Week
      </button>
      <span class="text-xs text-slate-400">{{ weekRangeLabel }}</span>
      <button
        @click="nextWeek"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        Next Week &rarr;
      </button>
    </div>

    <!-- Day Cards -->
    <div class="divide-y divide-slate-100">
      <button
        v-for="day in days"
        :key="day.date"
        @click="selectDay(day.date)"
        :class="[
          'w-full flex items-center px-5 py-3 text-left transition-colors duration-100',
          selectedDate === day.date
            ? 'bg-blue-50 border-l-4 border-l-blue-600'
            : 'hover:bg-slate-50 border-l-4 border-l-transparent',
        ]"
      >
        <div class="flex-1 min-w-0">
          <p :class="[
            'text-sm font-medium',
            selectedDate === day.date ? 'text-blue-700' : 'text-slate-700',
          ]">
            {{ day.dayName }}
          </p>
          <p class="text-xs text-slate-400 mt-0.5">{{ day.dateFormatted }}</p>
        </div>
        <span
          v-if="isToday(day.date)"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700"
        >
          Today
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';

export default defineComponent({
  name: 'O1Calendar',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-selected'],
  setup(props, { emit }) {
    const today = new Date();
    const baseDate = ref(new Date(today));

    const getWeekDays = (startDate: Date) => {
      const days = [];
      const start = new Date(startDate);
      start.setDate(start.getDate() - start.getDay() + 1); // Monday

      for (let i = 0; i < 6; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push({
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          date: date.toLocaleDateString('en-US'),
        });
      }

      return days;
    };

    const days = ref(getWeekDays(new Date(today)));

    const currentMonthLabel = computed(() => {
      if (days.value.length === 0) return '';
      const first = new Date(days.value[0].date);
      return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });

    const weekRangeLabel = computed(() => {
      if (days.value.length === 0) return '';
      const first = new Date(days.value[0].date);
      const last = new Date(days.value[days.value.length - 1].date);
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${first.toLocaleDateString('en-US', opts)} - ${last.toLocaleDateString('en-US', opts)}`;
    });

    const selectDay = (date: string) => {
      emit('date-selected', date);
    };

    const isToday = (date: string) => {
      return date === today.toLocaleDateString('en-US');
    };

    const prevWeek = () => {
      const start = new Date(days.value[0].date);
      start.setDate(start.getDate() - 7);
      days.value = getWeekDays(start);
    };

    const nextWeek = () => {
      const start = new Date(days.value[0].date);
      start.setDate(start.getDate() + 7);
      days.value = getWeekDays(start);
    };

    const prevMonth = () => {
      const start = new Date(days.value[0].date);
      start.setMonth(start.getMonth() - 1);
      days.value = getWeekDays(start);
    };

    const nextMonth = () => {
      const start = new Date(days.value[0].date);
      start.setMonth(start.getMonth() + 1);
      days.value = getWeekDays(start);
    };

    onMounted(() => {
      emit('date-selected', props.selectedDate);
    });

    return {
      days,
      currentMonthLabel,
      weekRangeLabel,
      selectDay,
      isToday,
      prevWeek,
      nextWeek,
      prevMonth,
      nextMonth,
    };
  },
});
</script>
