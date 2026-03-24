<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold text-gray-700">
          <font-awesome-icon :icon="['fas', 'calendar']" class="mr-1.5 text-violet-500" />
          Calendar
        </h2>
        <JumpToDate
          buttonClass="text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200"
          jumpButtonClass="bg-violet-600 text-white hover:bg-violet-700"
          @jump="onJump"
        />
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="prevMonth"
          class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-xs font-medium text-gray-500 min-w-[100px] text-center">
          {{ currentMonthLabel }}
        </span>
        <button
          @click="nextMonth"
          class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mini Month Grid -->
    <div class="px-4 pt-3 pb-1">
      <div class="grid grid-cols-7 gap-0 text-center mb-1">
        <span
          v-for="d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']"
          :key="d"
          class="text-[10px] font-medium text-gray-400 py-1"
        >
          {{ d }}
        </span>
      </div>
      <div class="grid grid-cols-7 gap-0 text-center">
        <!-- Empty slots for offset -->
        <span v-for="n in monthStartOffset" :key="'offset-' + n" class="py-1"></span>
        <!-- Day numbers -->
        <button
          v-for="day in monthDays"
          :key="day.date"
          @click="selectDay(day.date)"
          :class="[
            'text-xs py-1.5 rounded-lg transition-all duration-100',
            selectedDate === day.date
              ? 'bg-violet-600 text-white font-bold'
              : isToday(day.date)
                ? 'bg-violet-100 text-violet-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100',
          ]"
        >
          {{ day.dayNum }}
        </button>
      </div>
    </div>

    <!-- Week Strip -->
    <div class="border-t border-gray-100 mt-2">
      <div class="px-4 py-2 flex items-center justify-between">
        <button
          @click="prevWeek"
          class="text-[10px] text-violet-600 hover:text-violet-800 font-medium"
        >
          &larr; Prev
        </button>
        <span class="text-[10px] text-gray-400 font-medium">This Week</span>
        <button
          @click="nextWeek"
          class="text-[10px] text-violet-600 hover:text-violet-800 font-medium"
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
              ? 'bg-violet-600 text-white shadow-sm'
              : isToday(day.date)
                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                : 'hover:bg-gray-50 text-gray-600',
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
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import JumpToDate from '../shared/JumpToDate.vue';

library.add(faCalendar);

export default defineComponent({
  name: 'O2Calendar',
  components: { FontAwesomeIcon, JumpToDate },
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
    const weekBase = ref(new Date(today));

    const currentMonthLabel = computed(() => {
      const d = new Date(viewYear.value, viewMonth.value, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });

    const monthStartOffset = computed(() => {
      const first = new Date(viewYear.value, viewMonth.value, 1);
      const dow = first.getDay();
      return dow === 0 ? 6 : dow - 1; // Monday-based
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
      weekBase.value = start;
      weekDays.value = getWeekDays(start);
    };

    const nextWeek = () => {
      const start = new Date(weekDays.value[0].date);
      start.setDate(start.getDate() + 7);
      weekBase.value = start;
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

    const onJump = (date: string) => {
      const d = new Date(date);
      viewMonth.value = d.getMonth();
      viewYear.value = d.getFullYear();
      weekDays.value = getWeekDays(d);
      emit('date-selected', date);
    };

    // Sync calendar view when selectedDate changes (e.g., Jump to Dashboard from Delinquent)
    watch(() => props.selectedDate, (newDate) => {
      if (newDate) {
        const d = new Date(newDate);
        if (!isNaN(d.getTime())) {
          viewMonth.value = d.getMonth();
          viewYear.value = d.getFullYear();
          weekDays.value = getWeekDays(d);
        }
      }
    }, { immediate: true });

    onMounted(() => {
      emit('date-selected', props.selectedDate);
    });

    return {
      onJump,
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
