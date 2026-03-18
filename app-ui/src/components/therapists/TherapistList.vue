<template>
  <div class="space-y-4">
    <!-- Top bar: Search + Add button -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search therapists..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        @click="$emit('add')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Therapist</span>
      </button>
    </div>

    <!-- Filter tabs + count -->
    <div class="flex items-center justify-between">
      <div class="inline-flex rounded-lg bg-slate-100 p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeFilter === tab.value
              ? tab.value === 'delinquent'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="onTabClick(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <span v-if="activeFilter !== 'delinquent'" class="text-sm text-slate-500">
        {{ filteredTherapists.length }} therapist{{ filteredTherapists.length !== 1 ? 's' : '' }}
      </span>
      <span v-else class="text-sm text-amber-600">
        {{ pastDueTherapists.length }} therapist{{ pastDueTherapists.length !== 1 ? 's' : '' }} past due
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-2 text-sm text-slate-500">Loading therapists...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 rounded-xl p-6 text-center">
      <p class="text-sm text-red-700">{{ error }}</p>
      <button
        class="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>

    <!-- Delinquent tab -->
    <TherapistDelinquentTable
      v-else-if="activeFilter === 'delinquent'"
      :therapists="pastDueTherapists"
      :search="search"
    />

    <!-- Standard therapist table -->
    <TherapistTable
      v-else
      :therapists="filteredTherapists"
      @edit="(t) => $emit('edit', t)"
      @toggle-active="(t) => $emit('toggle-active', t)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, type PropType } from 'vue';
import type { Therapist } from '../../interfaces/Therapist';
import type { DelinquentTherapist } from '../../interfaces/Delinquency';
import TherapistTable from './TherapistTable.vue';
import TherapistDelinquentTable from './TherapistDelinquentTable.vue';

export default defineComponent({
  name: 'TherapistList',
  components: { TherapistTable, TherapistDelinquentTable },
  props: {
    therapists: { type: Array as PropType<Therapist[]>, required: true },
    pastDueTherapists: { type: Array as PropType<DelinquentTherapist[]>, default: () => [] },
    initialTab: { type: String as PropType<'all' | 'active' | 'inactive' | 'delinquent'>, default: 'all' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['add', 'edit', 'toggle-active', 'retry', 'tab-change'],
  setup(props, { emit }) {
    const search = ref('');
    const activeFilter = ref<'all' | 'active' | 'inactive' | 'delinquent'>(props.initialTab);

    onMounted(() => {
      if (props.initialTab !== 'all') {
        emit('tab-change', props.initialTab);
      }
    });

    const tabs = [
      { label: 'All', value: 'all' as const },
      { label: 'Active', value: 'active' as const },
      { label: 'Inactive', value: 'inactive' as const },
      { label: 'Delinquent', value: 'delinquent' as const },
    ];

    const onTabClick = (value: 'all' | 'active' | 'inactive' | 'delinquent') => {
      activeFilter.value = value;
      emit('tab-change', value);
    };

    const filteredTherapists = computed(() => {
      let list = props.therapists;

      if (activeFilter.value === 'active') {
        list = list.filter((t) => t.isActive);
      } else if (activeFilter.value === 'inactive') {
        list = list.filter((t) => !t.isActive);
      }

      const q = search.value.trim().toLowerCase();
      if (q) {
        list = list.filter((t) =>
          t.therapistName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phoneNumber.includes(q)
        );
      }

      return list;
    });

    return { search, activeFilter, tabs, filteredTherapists, onTabClick };
  },
});
</script>
