<template>
  <div class="space-y-3">
    <div>
      <label class="block text-xs font-medium text-slate-600 mb-1">{{ entityLabel }}</label>
      <select
        v-model="selectedId"
        data-testid="link-entity-select"
        class="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option :value="0" disabled>Select a {{ entityLabel.toLowerCase() }}...</option>
        <option v-for="o in options" :key="o.id" :value="o.id">
          {{ o.name }}
        </option>
      </select>
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
        :disabled="selectedId === 0 || saving"
        @click="$emit('submit', { id: selectedId, relationship, isPrimary })"
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
// WP-27: the caretaker↔patient link form (entity dropdown + relationship + primary), extracted
// from PatientCaretakerPanel / CaretakerPatientsList so the cross-add chain isn't a third copy.
// The parent owns the API call; this form only collects { id, relationship, isPrimary }.
// State resets by unmount — parents render it under v-if.
import { defineComponent, ref, computed, type PropType } from 'vue';

export interface LinkOption {
  id: number;
  name: string;
}

export default defineComponent({
  name: 'CaretakerLinkForm',
  props: {
    entityLabel: { type: String, required: true }, // 'Caretaker' | 'Patient' — what the dropdown lists
    options: { type: Array as PropType<LinkOption[]>, required: true },
    saving: { type: Boolean, default: false },
    submitLabel: { type: String, default: 'Link' },
  },
  emits: ['submit', 'cancel'],
  setup(props) {
    const selectedId = ref(0);
    const relationship = ref<string | null>(null);
    const isPrimary = ref(true);
    const primaryInputId = computed(() => `link-primary-${props.entityLabel.toLowerCase()}`);
    return { selectedId, relationship, isPrimary, primaryInputId };
  },
});
</script>
