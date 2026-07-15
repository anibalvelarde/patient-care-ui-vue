<template>
  <div class="relative">
    <label v-if="label" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {{ label }}
    </label>

    <!-- Selected option card -->
    <div
      v-if="modelValue"
      class="flex items-center justify-between rounded-lg border px-3 py-2"
      :class="accentClasses"
      :data-testid="`${testId}-selected`"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium text-slate-800 truncate">{{ modelValue.name }}</p>
        <p v-if="modelValue.detail" class="text-xs text-slate-500 truncate">{{ modelValue.detail }}</p>
      </div>
      <button
        type="button"
        class="ml-2 shrink-0 text-slate-400 hover:text-slate-600"
        :aria-label="`Clear ${label || 'selection'}`"
        :data-testid="`${testId}-clear`"
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
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :placeholder="placeholder"
        :data-testid="`${testId}-input`"
        @focus="open = true"
        @blur="closeSoon"
      />
      <ul
        v-if="open && visibleOptions.length > 0"
        class="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
      >
        <li v-for="o in visibleOptions" :key="o.id">
          <button
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-blue-50"
            :data-testid="`${testId}-option`"
            @mousedown.prevent="pick(o)"
          >
            <p class="text-sm text-slate-800">{{ o.name }}</p>
            <p v-if="o.detail" class="text-xs text-slate-500">{{ o.detail }}</p>
          </button>
        </li>
      </ul>
      <p
        v-if="open && emptyStateText"
        class="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 shadow-lg"
        :data-testid="`${testId}-empty`"
      >
        {{ emptyStateText }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import type { PropType } from 'vue';

export const LOOKUP_DEBOUNCE_MS = 300;

// The row shape every consumer maps its lookup DTO into — slim by design (owner gate G3):
// pickers show name + one optional detail line, nothing richer.
export interface LookupOption {
  id: number;
  name: string;
  detail?: string | null;
}

/**
 * WP-30 (U2): shared server-backed typeahead — generalizes the WP-22 PatientSearchSelect
 * pattern onto the new lookup endpoints. Debounced (300ms), min 1 char, server caps at 20;
 * keyboard nav stays basic (type + click) by design. Consumers own the fetch (their mocked
 * HTTP client) and pass it in as `fetchOptions`.
 */
export default defineComponent({
  name: 'LookupSelect',
  props: {
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Type to search…' },
    modelValue: { type: Object as PropType<LookupOption | null>, default: null },
    /** Async lookup call — (q) => mapped LookupOption[] off the slim lookup endpoint. */
    fetchOptions: { type: Function as PropType<(q: string) => Promise<LookupOption[]>>, required: true },
    /** Ids to hide from results (already-linked records, the other side of a merge, …). */
    excludeIds: { type: Array as PropType<number[]>, default: () => [] },
    /** Border/background accent for the selected card: 'keep' (green), 'remove' (red), or neutral. */
    accent: { type: String as PropType<'keep' | 'remove' | 'neutral'>, default: 'neutral' },
    /** data-testid prefix — `${testId}-input`, `${testId}-option`, `${testId}-selected`, … */
    testId: { type: String, default: 'lookup' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const search = ref('');
    const open = ref(false);
    const loading = ref(false);
    const options = ref<LookupOption[]>([]);
    const searched = ref(false); // a fetch has completed for the current term

    // Debounced server-side lookup; results for a stale term are discarded.
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    watch(search, (term) => {
      clearTimeout(debounceTimer);
      searched.value = false;
      const q = term.trim();
      if (!q) {
        options.value = [];
        loading.value = false;
        return;
      }
      debounceTimer = setTimeout(async () => {
        loading.value = true;
        try {
          const result = await props.fetchOptions(q);
          if (search.value.trim() === q) {
            options.value = result;
            searched.value = true;
          }
        } catch {
          options.value = []; // fail quiet — the empty state reads as "no matches"
          searched.value = true;
        } finally {
          loading.value = false;
        }
      }, LOOKUP_DEBOUNCE_MS);
    });

    const visibleOptions = computed(() =>
      options.value.filter((o) => !props.excludeIds.includes(o.id)),
    );

    const emptyStateText = computed(() => {
      if (!search.value.trim()) return 'Type to search…';
      if (loading.value || !searched.value) return 'Searching…';
      if (visibleOptions.value.length === 0) return `No matches for "${search.value}"`;
      return '';
    });

    const accentClasses = computed(() => {
      if (props.accent === 'keep') return 'border-emerald-300 bg-emerald-50';
      if (props.accent === 'remove') return 'border-rose-300 bg-rose-50';
      return 'border-slate-300 bg-slate-50';
    });

    const pick = (o: LookupOption) => {
      emit('update:modelValue', o);
      search.value = '';
      options.value = [];
      open.value = false;
    };

    // Let a mousedown on a result land before the blur closes the list.
    const closeSoon = () => {
      window.setTimeout(() => { open.value = false; }, 150);
    };

    return { search, open, visibleOptions, emptyStateText, accentClasses, pick, closeSoon };
  },
});
</script>
