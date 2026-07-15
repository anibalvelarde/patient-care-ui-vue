<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs font-medium text-slate-600 mb-1">{{ entityLabel }}</label>
      <!-- WP-30: server-backed typeahead against the lookup endpoint — was a full-census dropdown -->
      <LookupSelect
        v-model="selected"
        :placeholder="`Search for a ${entityLabel.toLowerCase()}…`"
        :fetch-options="fetchOptions"
        :exclude-ids="excludeIds"
        test-id="link-entity"
      />
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
      <select
        v-model="relationship"
        data-testid="link-relationship-select"
        class="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option :value="null">None</option>
        <option value="Father">Father</option>
        <option value="Mother">Mother</option>
        <option value="Relative">Relative</option>
        <option value="HiredHelp">Hired Help</option>
      </select>
    </div>
    <div class="flex items-center space-x-2">
      <input
        :id="primaryInputId"
        v-model="isPrimary"
        type="checkbox"
        data-testid="link-primary-checkbox"
        class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <label :for="primaryInputId" class="text-sm text-slate-700">Primary caretaker</label>
    </div>
    <div class="flex items-center space-x-2">
      <button
        data-testid="link-submit"
        class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
        :disabled="!selected || saving"
        @click="onSubmit"
      >
        {{ submitLabel }}
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script lang="ts">
// WP-27: the caretaker↔patient link form (entity picker + relationship + primary), extracted
// from PatientCaretakerPanel / CaretakerPatientsList so the cross-add chain isn't a third copy.
// WP-30: the entity picker is a lookup-endpoint typeahead — parents pass `fetchOptions` (and
// optionally `excludeIds` for already-linked records) instead of a preloaded options list.
// The parent owns the link API call; this form only collects { id, name, relationship, isPrimary }.
// State resets by unmount — parents render it under v-if.
import { defineComponent, ref, computed, type PropType } from 'vue';
import LookupSelect, { type LookupOption } from './LookupSelect.vue';

export type { LookupOption };

export default defineComponent({
  name: 'CaretakerLinkForm',
  components: { LookupSelect },
  props: {
    entityLabel: { type: String, required: true }, // 'Caretaker' | 'Patient' — what the picker searches
    fetchOptions: { type: Function as PropType<(q: string) => Promise<LookupOption[]>>, required: true },
    excludeIds: { type: Array as PropType<number[]>, default: () => [] },
    saving: { type: Boolean, default: false },
    submitLabel: { type: String, default: 'Link' },
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const selected = ref<LookupOption | null>(null);
    const relationship = ref<string | null>(null);
    const isPrimary = ref(true);
    const primaryInputId = computed(() => `link-primary-${props.entityLabel.toLowerCase()}`);

    const onSubmit = () => {
      if (!selected.value) return;
      emit('submit', {
        id: selected.value.id,
        name: selected.value.name,
        relationship: relationship.value,
        isPrimary: isPrimary.value,
      });
    };

    return { selected, relationship, isPrimary, primaryInputId, onSubmit };
  },
});
</script>
