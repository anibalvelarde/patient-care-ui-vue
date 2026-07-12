<template>
  <div class="relative">
    <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {{ label }}
    </label>

    <!-- Selected patient card -->
    <div
      v-if="modelValue"
      class="flex items-center justify-between rounded-lg border px-3 py-2"
      :class="accentClasses"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium text-slate-800 truncate">{{ modelValue.patientName }}</p>
        <p class="text-xs text-slate-500 truncate">
          MRN {{ modelValue.medicalRecordNumber ?? '—' }} · Cedula {{ modelValue.cedula ?? '—' }}
        </p>
      </div>
      <button
        type="button"
        class="ml-2 shrink-0 text-slate-400 hover:text-slate-600"
        :aria-label="`Clear ${label}`"
        @click="$emit('update:modelValue', null)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Search input + dropdown -->
    <div v-else>
      <input
        v-model="search"
        type="text"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        :placeholder="placeholder"
        @focus="open = true"
        @blur="closeSoon"
      />
      <ul
        v-if="open && filtered.length > 0"
        class="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
      >
        <li v-for="p in filtered" :key="p.patientId">
          <button
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-violet-50"
            @mousedown.prevent="pick(p)"
          >
            <p class="text-sm text-slate-800">{{ p.patientName }}</p>
            <p class="text-xs text-slate-500">
              MRN {{ p.medicalRecordNumber ?? '—' }} · Cedula {{ p.cedula ?? '—' }}
              <span v-if="!p.isActive" class="ml-1 text-amber-600">(inactive)</span>
            </p>
          </button>
        </li>
      </ul>
      <p
        v-if="open && search.trim() && filtered.length === 0"
        class="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 shadow-lg"
      >
        No patients match "{{ search }}"
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import type { PropType } from 'vue';
import type { Patient } from '../../interfaces/Patient';

/**
 * WP-22 (F2): lightweight client-side patient picker — filters an already-loaded patient
 * list by name / MRN / cedula. Built for the Admin › Merge Patients panel but reusable
 * anywhere a single patient must be selected from the full census.
 */
export default defineComponent({
  name: 'PatientSearchSelect',
  props: {
    label: { type: String, required: true },
    placeholder: { type: String, default: 'Search by name, MRN, or cedula…' },
    patients: { type: Array as PropType<Patient[]>, required: true },
    modelValue: { type: Object as PropType<Patient | null>, default: null },
    /** Patient ID to exclude from results (the other side of the merge). */
    excludeId: { type: Number as PropType<number | null>, default: null },
    /** Border/background accent for the selected card: 'keep' (green) or 'remove' (red). */
    accent: { type: String as PropType<'keep' | 'remove'>, default: 'keep' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const search = ref('');
    const open = ref(false);
    const maxResults = 8;

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return [];
      return props.patients
        .filter((p) => p.patientId !== props.excludeId)
        .filter(
          (p) =>
            p.patientName.toLowerCase().includes(q) ||
            (p.medicalRecordNumber ?? '').toLowerCase().includes(q) ||
            (p.cedula ?? '').toLowerCase().includes(q),
        )
        .slice(0, maxResults);
    });

    const accentClasses = computed(() =>
      props.accent === 'remove'
        ? 'border-rose-300 bg-rose-50'
        : 'border-emerald-300 bg-emerald-50',
    );

    const pick = (p: Patient) => {
      emit('update:modelValue', p);
      search.value = '';
      open.value = false;
    };

    // Let a mousedown on a result land before the blur closes the list.
    const closeSoon = () => {
      window.setTimeout(() => { open.value = false; }, 150);
    };

    return { search, open, filtered, accentClasses, pick, closeSoon };
  },
});
</script>
