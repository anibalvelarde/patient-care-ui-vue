<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!matrix || matrix.therapists.length === 0" class="py-20 text-center">
      <p class="text-sm text-slate-500">No therapists or sessions found for this week and site.</p>
    </div>

    <template v-else>
      <!-- Day tabs -->
      <div class="border-b border-slate-200 px-4 pt-3">
        <div class="flex space-x-1">
          <button
            v-for="day in days"
            :key="day.date"
            @click="activeDay = day.date"
            class="px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative"
            :class="[
              activeDay === day.date
                ? 'bg-white text-violet-700 border border-slate-200 border-b-white -mb-px z-10'
                : isToday(day.date)
                  ? 'text-violet-600 hover:bg-violet-50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            ]"
          >
            <span class="font-semibold">{{ day.shortLabel }}</span>
            <span class="ml-1 text-xs" :class="activeDay === day.date ? 'text-violet-500' : 'text-slate-400'">{{ day.monthDay }}</span>
            <span v-if="getDaySessionCount(day.date) > 0" class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full"
              :class="activeDay === day.date ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'"
            >{{ getDaySessionCount(day.date) }}</span>
          </button>
        </div>
      </div>

      <!-- Day grid: therapists × hours -->
      <div class="overflow-auto max-h-[calc(100vh-320px)]">
        <table class="w-full border-collapse">
          <thead class="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th class="sticky left-0 z-20 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-600 border-b border-r border-slate-200 min-w-[180px]">
                Therapist
              </th>
              <th
                v-for="hour in hours"
                :key="hour"
                class="px-1 py-2.5 text-center text-xs font-semibold text-slate-500 border-b border-slate-200 min-w-[100px]"
              >
                {{ formatHour(hour) }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in matrix.therapists" :key="row.therapistId" class="group">
              <!-- Therapist name cell (sticky) -->
              <td class="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 border-r border-slate-200 transition-colors">
                <div class="text-sm font-medium text-slate-700 whitespace-nowrap">{{ row.therapistName }}</div>
                <div v-if="row.specialties.length > 0" class="flex flex-wrap gap-0.5 mt-1">
                  <span
                    v-for="spec in row.specialties"
                    :key="spec"
                    class="inline-block text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium"
                  >{{ spec }}</span>
                </div>
              </td>
              <!-- Hour cells for the active day -->
              <td
                v-for="hour in hours"
                :key="row.therapistId + '-' + hour"
                class="px-1 py-1 text-center transition-colors border-l border-slate-100"
                :class="[
                  getSlot(row, activeDay, hour)?.sessionId
                    ? 'cursor-pointer'
                    : 'cursor-pointer hover:bg-violet-50',
                ]"
                @click="onSlotClick(row, activeDay, hour)"
              >
                <div
                  v-if="getSlot(row, activeDay, hour)?.sessionId"
                  class="mx-0.5 px-2 py-1.5 rounded-lg text-xs leading-snug font-medium"
                  :class="getSlotClass(getSlot(row, activeDay, hour)!.appointmentStatusId!)"
                >
                  <div class="truncate font-semibold">{{ getSlot(row, activeDay, hour)!.patientName }}</div>
                  <div class="text-[10px] opacity-80 mt-0.5">{{ getSlot(row, activeDay, hour)!.specialtyAbbreviation }}</div>
                  <div class="text-[10px] opacity-60">{{ getSlot(row, activeDay, hour)!.statusName }}</div>
                </div>
                <div v-else class="h-14 rounded-lg mx-0.5 border border-dashed border-transparent hover:border-violet-200"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Status legend -->
      <div class="border-t border-slate-200 px-4 py-3 bg-slate-50">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Legend</span>
          <div v-for="item in legendItems" :key="item.label" class="flex items-center space-x-1.5">
            <span class="inline-block w-3 h-3 rounded" :class="item.bgClass"></span>
            <span class="text-[11px] text-slate-500">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, type PropType } from 'vue';
import type { ScheduleMatrixResponse, TherapistScheduleRow, ScheduleSlot } from '../../interfaces/ScheduleMatrix';
import { getStatusBadgeClass } from '../../utils/statusHelpers';

export default defineComponent({
  name: 'ScheduleMatrix',
  props: {
    matrix: { type: Object as PropType<ScheduleMatrixResponse | null>, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['book', 'view'],
  setup(props, { emit }) {
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
    const activeDay = ref('');

    const days = computed(() => {
      if (!props.matrix) return [];
      const start = new Date(props.matrix.weekStart + 'T00:00:00');
      const result = [];
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 6; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
        result.push({
          date: dateStr,
          shortLabel: dayLabels[i],
          monthDay,
        });
      }
      return result;
    });

    // Default active day: today if in range, else Monday
    watch(() => props.matrix, () => {
      if (!days.value.length) return;
      const today = new Date().toISOString().split('T')[0];
      const todayInWeek = days.value.find(d => d.date === today);
      activeDay.value = todayInWeek ? today : days.value[0].date;
    }, { immediate: true });

    const isToday = (dateStr: string) => {
      return dateStr === new Date().toISOString().split('T')[0];
    };

    const formatHour = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    };

    const getSlot = (row: TherapistScheduleRow, date: string, hour: number): ScheduleSlot | undefined => {
      return row.slots.find(s => {
        const slotDate = s.date.split('T')[0];
        const slotHour = parseInt(s.time.split(':')[0], 10);
        return slotDate === date && slotHour === hour;
      });
    };

    const getDaySessionCount = (date: string): number => {
      if (!props.matrix) return 0;
      let count = 0;
      for (const row of props.matrix.therapists) {
        for (const slot of row.slots) {
          if (slot.sessionId && slot.date.split('T')[0] === date) count++;
        }
      }
      return count;
    };

    const getSlotClass = (statusId: number) => getStatusBadgeClass(statusId);

    const onSlotClick = (row: TherapistScheduleRow, date: string, hour: number) => {
      const slot = getSlot(row, date, hour);
      if (slot?.sessionId) {
        emit('view', slot.sessionId, date);
      } else {
        emit('book', row.therapistId, date, `${hour.toString().padStart(2, '0')}:00`);
      }
    };

    const legendItems = [
      { label: 'Proposed', bgClass: 'bg-amber-200' },
      { label: 'Confirmed', bgClass: 'bg-green-200' },
      { label: 'Cancelled', bgClass: 'bg-slate-200' },
      { label: 'Completed', bgClass: 'bg-gray-200' },
      { label: 'No Show', bgClass: 'bg-red-200' },
      { label: 'Checked In', bgClass: 'bg-blue-200' },
      { label: 'In Therapy', bgClass: 'bg-purple-200' },
    ];

    return { hours, days, activeDay, isToday, formatHour, getSlot, getDaySessionCount, getSlotClass, onSlotClick, legendItems };
  },
});
</script>
