<template>
  <div v-if="progress && progress.sessionsCreated > 0" class="mt-3 border-t border-slate-100 pt-3">
    <!-- Progress bar -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-slate-500">Progress</span>
      <span class="text-xs text-slate-400">
        {{ progress.sessionsCompleted }}/{{ progress.totalPlanned }} completed
      </span>
    </div>
    <div class="w-full bg-slate-100 rounded-full h-2 mb-2">
      <div
        class="bg-emerald-500 h-2 rounded-full transition-all"
        :style="{ width: progressPct + '%' }"
      ></div>
    </div>

    <!-- Next upcoming -->
    <p v-if="progress.nextUpcomingDate" class="text-xs text-slate-500 mb-2">
      Next session: {{ formatDate(progress.nextUpcomingDate) }}
    </p>

    <!-- Compact session list (collapsed by default) -->
    <div>
      <button
        @click="expanded = !expanded"
        class="text-xs text-violet-600 hover:text-violet-700 font-medium"
      >
        {{ expanded ? 'Hide' : 'Show' }} {{ progress.sessionsCreated }} session{{ progress.sessionsCreated !== 1 ? 's' : '' }}
      </button>
      <div v-if="expanded" class="mt-2 space-y-1 max-h-48 overflow-y-auto">
        <router-link
          v-for="s in progress.sessions"
          :key="s.sessionId"
          :to="{ path: '/', query: { date: s.sessionDate, highlightSession: s.sessionId } }"
          class="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1 hover:bg-violet-50 cursor-pointer transition-colors"
        >
          <div class="flex items-center space-x-2">
            <span class="text-slate-600">{{ formatDate(s.sessionDate) }}</span>
            <span class="text-slate-400">{{ s.sessionTime?.replace(/:00$/, '') }}</span>
            <span class="font-medium text-violet-600">{{ s.specialtyAbbreviation }}</span>
            <span class="text-slate-500">{{ s.therapistName }}</span>
          </div>
          <span :class="statusBadgeClass(s.appointmentStatusId)">{{ s.statusName }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import type { PlanProgressSummary } from '../../interfaces/TreatmentPlan';
import { TreatmentPlansHttpClient } from '../../services/TreatmentPlansHttpClient';

export default defineComponent({
  name: 'PlanProgressCard',
  props: {
    planId: { type: Number, required: true },
  },
  setup(props) {
    const client = new TreatmentPlansHttpClient();
    const progress = ref<PlanProgressSummary | null>(null);
    const expanded = ref(false);

    const progressPct = computed(() => {
      if (!progress.value || progress.value.totalPlanned === 0) return 0;
      return Math.round(progress.value.sessionsCompleted / progress.value.totalPlanned * 100);
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const statusBadgeClass = (statusId: number) => {
      switch (statusId) {
        case 1: return 'text-blue-600'; // Proposed
        case 2: return 'text-emerald-600'; // Confirmed
        case 3: return 'text-red-500'; // Cancelled
        case 4: return 'text-gray-600'; // Completed
        default: return 'text-slate-500';
      }
    };

    onMounted(async () => {
      try {
        progress.value = await client.getProgress(props.planId);
      } catch {
        // Non-fatal
      }
    });

    return { progress, expanded, progressPct, formatDate, statusBadgeClass };
  },
});
</script>
