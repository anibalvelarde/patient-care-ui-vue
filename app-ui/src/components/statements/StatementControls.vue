<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4 print:hidden">
    <div class="flex flex-col sm:flex-row sm:items-end gap-4">
      <!-- Caretaker Select -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-slate-700 mb-1">Caretaker</label>
        <select
          v-model="selectedCaretakerId"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option :value="null" disabled>Select a caretaker...</option>
          <option
            v-for="ct in caretakers"
            :key="ct.caretakerId"
            :value="ct.caretakerId"
          >
            {{ ct.caretakerName }}
          </option>
        </select>
      </div>

      <!-- From Date -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">From</label>
        <input
          v-model="fromDate"
          type="date"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- To Date -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">To</label>
        <input
          v-model="toDate"
          type="date"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Generate Button -->
      <div>
        <button
          :disabled="!selectedCaretakerId || loading"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="onGenerate"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generate Statement
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue';

interface CaretakerOption {
  caretakerId: number
  caretakerName: string
}

export default defineComponent({
  name: 'StatementControls',
  props: {
    caretakers: { type: Array as PropType<CaretakerOption[]>, required: true },
    loading: { type: Boolean, default: false },
  },
  emits: ['generate'],
  setup(_, { emit }) {
    const selectedCaretakerId = ref<number | null>(null);

    // Default: 90 days ago to today
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const toIso = (d: Date) => d.toISOString().split('T')[0];
    const fromDate = ref(toIso(ninetyDaysAgo));
    const toDate = ref(toIso(today));

    const onGenerate = () => {
      if (selectedCaretakerId.value) {
        emit('generate', selectedCaretakerId.value, fromDate.value, toDate.value);
      }
    };

    return { selectedCaretakerId, fromDate, toDate, onGenerate };
  },
});
</script>
