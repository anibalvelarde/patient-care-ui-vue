<template>
  <div class="bg-[#FFFBF5] px-6 py-4 flex-shrink-0">
    <div class="max-w-3xl mx-auto flex items-center justify-center gap-2">
      <button
        v-for="day in weekDays"
        :key="day.dateStr"
        @click="$emit('date-selected', day.dateStr)"
        :class="[
          'flex flex-col items-center px-4 py-2.5 rounded-2xl transition-all duration-200 min-w-[72px]',
          day.dateStr === selectedDate
            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
            : day.isToday
              ? 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100'
              : 'bg-white text-stone-600 border-2 border-stone-150 hover:border-amber-200 hover:bg-amber-50',
        ]"
      >
        <span :class="[
          'text-[10px] font-semibold uppercase tracking-wider',
          day.dateStr === selectedDate ? 'text-amber-100' : 'text-stone-400',
        ]">
          {{ day.dayName }}
        </span>
        <span class="text-lg font-bold mt-0.5">{{ day.dayNum }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'O7WeekPills',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-selected'],
  setup(props) {
    const getStartOfWeek = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const weekDays = computed(() => {
      const selected = new Date(props.selectedDate);
      const start = getStartOfWeek(selected);
      const today = new Date().toLocaleDateString('en-US');

      const days = [];
      for (let i = 0; i < 6; i++) { // Mon-Sat
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
          dateStr: d.toLocaleDateString('en-US'),
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: d.getDate(),
          isToday: d.toLocaleDateString('en-US') === today,
        });
      }
      return days;
    });

    return { weekDays };
  },
});
</script>
