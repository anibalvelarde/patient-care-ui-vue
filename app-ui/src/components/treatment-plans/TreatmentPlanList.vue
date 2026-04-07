<template>
  <div class="space-y-4">
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-100 rounded-xl px-5 py-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-200">
            <span class="text-lg font-bold text-slate-600">{{ draftCount }}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">Draft</p>
            <p class="text-xs text-slate-400">Pending activation</p>
          </div>
        </div>
      </div>
      <div class="bg-emerald-100 rounded-xl px-5 py-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-200">
            <span class="text-lg font-bold text-emerald-700">{{ activeCount }}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">Active</p>
            <p class="text-xs text-slate-400">In progress</p>
          </div>
        </div>
      </div>
      <div class="bg-gray-100 rounded-xl px-5 py-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-200">
            <span class="text-lg font-bold text-gray-600">{{ completedCount }}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">Completed</p>
            <p class="text-xs text-slate-400">Finished</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab bar + Create button -->
    <div class="flex items-center justify-between mb-4">
      <div class="inline-flex rounded-lg bg-slate-100 p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === tab
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
      <button
        :disabled="!canCreate"
        :title="!canCreate ? 'Patient needs a completed discovery session first' : 'Create a new treatment plan'"
        :class="[
          'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          canCreate
            ? 'text-white bg-violet-600 hover:bg-violet-700'
            : 'text-white bg-violet-300 cursor-not-allowed',
        ]"
        @click="canCreate && $emit('create')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Create Treatment Plan</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-slate-500">Loading treatment plans...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 rounded-xl p-6 text-center">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredPlans.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <p class="text-sm text-slate-500">No treatment plans found.</p>
    </div>

    <!-- Plan cards -->
    <div v-else class="space-y-4">
      <div
        v-for="plan in filteredPlans"
        :key="plan.id"
        class="bg-white border border-slate-200 rounded-xl p-5"
      >
        <!-- Card header -->
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold text-slate-800">Plan #{{ plan.id }}</span>
          <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', planStatusBadgeClass(plan.planStatus)]">
            {{ plan.planStatus }}
          </span>
        </div>

        <!-- Card body -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
          <div class="text-sm text-slate-600">
            <span class="text-slate-400">Discovery:</span>
            {{ formatDate(plan.discoveryDate) }} &middot; {{ plan.discoverySpecialty }}
          </div>
          <div class="text-sm text-slate-600">
            <span class="text-slate-400">Created by:</span>
            {{ plan.createdByTherapistName }}
          </div>
          <div class="text-sm text-slate-600">
            <span class="text-slate-400">Frequency:</span>
            {{ plan.weeklyFrequency }}x/week &middot; {{ plan.durationWeeks }} weeks
          </div>
          <div class="text-sm text-slate-600">
            <span class="text-slate-400">Lines:</span>
            {{ plan.lines.length }} treatment line{{ plan.lines.length !== 1 ? 's' : '' }}
            <span v-if="hasLineCountMismatch(plan)" class="text-amber-600 text-xs ml-1" :title="`Expected ${plan.weeklyFrequency} line(s) to match sessions per week`">
              (mismatch)
            </span>
          </div>
        </div>

        <!-- Lines summary -->
        <div v-if="plan.lines.length > 0" class="mt-3 border-t border-slate-100 pt-3">
          <div v-for="line in plan.lines" :key="line.id" class="text-xs text-slate-600">
            &bull; {{ line.specialtyAbbreviation }} &mdash; {{ line.preferredTherapistName || 'Any Qualified' }}
          </div>
        </div>

        <!-- Plan progress (Active plans) -->
        <PlanProgressCard v-if="plan.planStatus === 'Active'" :plan-id="plan.id" />

        <!-- Card footer -->
        <div class="mt-3 pt-3 border-t border-slate-100 flex justify-end space-x-2">
          <button
            v-if="plan.planStatus === 'Draft'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            @click="$emit('edit', plan)"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button
            v-if="plan.planStatus === 'Draft'"
            :disabled="hasLineCountMismatch(plan)"
            :title="hasLineCountMismatch(plan) ? `Line count (${plan.lines.length}) must match sessions per week (${plan.weeklyFrequency})` : ''"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              hasLineCountMismatch(plan)
                ? 'text-white bg-emerald-300 cursor-not-allowed'
                : 'text-white bg-emerald-600 hover:bg-emerald-700',
            ]"
            @click="$emit('activate', plan)"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            Activate
          </button>
          <button
            v-if="plan.planStatus === 'Active'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            @click="$emit('schedule', plan)"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Sessions
          </button>
          <button
            v-if="plan.planStatus === 'Active'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors"
            @click="$emit('complete', plan)"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Complete
          </button>
          <button
            v-if="plan.planStatus === 'Draft' || plan.planStatus === 'Active'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            @click="$emit('cancel', plan)"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { TreatmentPlan, PlanStatus } from '../../interfaces/TreatmentPlan';
import { planStatusBadgeClass } from '../../interfaces/TreatmentPlan';
import PlanProgressCard from './PlanProgressCard.vue';

export default defineComponent({
  name: 'TreatmentPlanList',
  components: { PlanProgressCard },
  props: {
    plans: { type: Array as PropType<TreatmentPlan[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    initialTab: { type: String, default: 'All' },
    canCreate: { type: Boolean, default: true },
  },
  emits: ['create', 'edit', 'activate', 'complete', 'cancel', 'schedule'],
  setup(props) {
    const tabs = ['All', 'Draft', 'Active', 'Completed', 'Cancelled'];
    const activeTab = ref(props.initialTab);

    const draftCount = computed(() => props.plans.filter(p => p.planStatus === 'Draft').length);
    const activeCount = computed(() => props.plans.filter(p => p.planStatus === 'Active').length);
    const completedCount = computed(() => props.plans.filter(p => p.planStatus === 'Completed').length);

    const filteredPlans = computed(() => {
      if (activeTab.value === 'All') return props.plans;
      return props.plans.filter(p => p.planStatus === activeTab.value as PlanStatus);
    });

    const hasLineCountMismatch = (plan: TreatmentPlan) => {
      return plan.lines.length !== plan.weeklyFrequency;
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return {
      tabs,
      activeTab,
      draftCount,
      activeCount,
      completedCount,
      filteredPlans,
      hasLineCountMismatch,
      planStatusBadgeClass,
      formatDate,
    };
  },
});
</script>
