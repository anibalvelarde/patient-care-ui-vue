<template>
  <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden h-full">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-200">
        <font-awesome-icon :icon="['fas', 'calendar']" class="mr-1.5 text-cyan-400" />
        Calendar
      </h2>
      <div class="flex items-center gap-1">
        <button
          @click="prevMonth"
          class="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-xs font-medium text-slate-400 min-w-[100px] text-center">
          {{ currentMonthLabel }}
        </span>
        <button
          @click="nextMonth"
          class="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mini Month Grid -->
    <div class="px-3 pt-3 pb-1">
      <div class="grid grid-cols-7 gap-0 text-center mb-1">
        <span
          v-for="d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']"
          :key="d"
          class="text-[10px] font-medium text-slate-500 py-1"
        >
          {{ d }}
        </span>
      </div>
      <div class="grid grid-cols-7 gap-0 text-center">
        <span v-for="n in monthStartOffset" :key="'offset-' + n" class="py-1"></span>
        <button
          v-for="day in monthDays"
          :key="day.date"
          @click="selectDay(day.date)"
          :class="[
            'text-xs py-1.5 rounded-lg transition-all duration-100',
            selectedDate === day.date
              ? 'bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20'
              : isToday(day.date)
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200',
          ]"
        >
          {{ day.dayNum }}
        </button>
      </div>
    </div>

    <!-- Week Strip -->
    <div class="border-t border-slate-700/50 mt-2">
      <div class="px-4 py-2 flex items-center justify-between">
        <button
          @click="prevWeek"
          class="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
        >
          &larr; Prev
        </button>
        <span class="text-[10px] text-slate-500 font-medium">This Week</span>
        <button
          @click="nextWeek"
          class="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
        >
          Next &rarr;
        </button>
      </div>
      <div class="px-2 pb-3 flex gap-1">
        <button
          v-for="day in weekDays"
          :key="day.date"
          @click="selectDay(day.date)"
          :class="[
            'flex-1 py-2 rounded-lg text-center transition-all duration-100',
            selectedDate === day.date
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : isToday(day.date)
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'hover:bg-slate-700 text-slate-400',
          ]"
        >
          <div class="text-[10px] font-medium leading-tight">{{ day.shortName }}</div>
          <div class="text-sm font-bold leading-tight mt-0.5">{{ day.dayNum }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

library.add(faCalendar);

export default defineComponent({
  name: 'O3Calendar',
  components: { FontAwesomeIcon },
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
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
        days.push({
          dayNum: i,
          date: d.toLocaleDateString('en-US'),
        });
      }
      return days;
    });

    const getWeekDays = (base: Date) => {
      const days = [];
      const start = new Date(base);
      start.setDate(start.getDate() - start.getDay() + 1);
      for (let i = 0; i < 6; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
          shortName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: d.getDate(),
          date: d.toLocaleDateString('en-US'),
        });
      }
      return days;
    };

    const weekDays = ref(getWeekDays(new Date(today)));

    const selectDay = (date: string) => {
      emit('date-selected', date);
    };

    const isToday = (date: string) => {
      return date === today.toLocaleDateString('en-US');
    };

    const prevWeek = () => {
      const start = new Date(weekDays.value[0].date);
      start.setDate(start.getDate() - 7);
      weekDays.value = getWeekDays(start);
    };

    const nextWeek = () => {
      const start = new Date(weekDays.value[0].date);
      start.setDate(start.getDate() + 7);
      weekDays.value = getWeekDays(start);
    };

    const prevMonth = () => {
      if (viewMonth.value === 0) {
        viewMonth.value = 11;
        viewYear.value--;
      } else {
        viewMonth.value--;
      }
    };

    const nextMonth = () => {
      if (viewMonth.value === 11) {
        viewMonth.value = 0;
        viewYear.value++;
      } else {
        viewMonth.value++;
      }
    };

    onMounted(() => {
      emit('date-selected', props.selectedDate);
    });

    return {
      currentMonthLabel,
      monthStartOffset,
      monthDays,
      weekDays,
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
