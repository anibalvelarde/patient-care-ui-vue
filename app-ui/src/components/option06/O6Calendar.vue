<template>
  <div class="bg-white border-b border-slate-200 flex-shrink-0">
    <!-- Toggle bar -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full px-5 py-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors"
    >
      <span>{{ isExpanded ? 'Hide Calendar' : 'Show Calendar' }}</span>
      <svg
        :class="['w-3 h-3 transition-transform', isExpanded ? 'rotate-180' : '']"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Collapsible week strip -->
    <div v-if="isExpanded" class="px-5 pb-3">
      <div class="flex items-center gap-1">
        <button
          @click="prevWeek"
          class="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 grid grid-cols-7 gap-1">
          <button
            v-for="day in weekDays"
            :key="day.dateStr"
            @click="$emit('date-selected', day.dateStr)"
            :class="[
              'flex flex-col items-center py-1.5 rounded-lg text-center transition-colors',
              day.dateStr === selectedDate
                ? 'bg-blue-600 text-white'
                : day.isToday
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            <span class="text-[9px] font-medium uppercase">{{ day.dayName }}</span>
            <span class="text-sm font-semibold">{{ day.dayNum }}</span>
          </button>
        </div>

        <button
          @click="nextWeek"
          class="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'O6Calendar',
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
  },
  emits: ['date-selected'],
  setup(props) {
    const isExpanded = ref(true);
    const weekOffset = ref(0);

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
      start.setDate(start.getDate() + weekOffset.value * 7);
      const today = new Date().toLocaleDateString('en-US');

      const days = [];
      for (let i = 0; i < 7; i++) {
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

    const prevWeek = () => { weekOffset.value--; };
    const nextWeek = () => { weekOffset.value++; };

    return {
      isExpanded,
      weekDays,
      prevWeek,
      nextWeek,
    };
  },
});
</script>
