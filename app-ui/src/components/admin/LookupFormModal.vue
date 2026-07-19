<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form class="flex-1 overflow-y-auto px-6 py-4 space-y-4" @submit.prevent="handleSubmit">
          <div v-for="field in fields" :key="field.key">
            <!-- WP-39 (PR-2): checkbox fields (e.g. "Offered on-site") render label-inline -->
            <label v-if="field.type === 'checkbox'" class="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                v-model="formData[field.key]"
                type="checkbox"
                :data-testid="`lookup-form-${field.key}-checkbox`"
                class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              {{ field.label }}
            </label>
            <template v-else>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ field.label }}{{ field.required ? ' *' : '' }}
              </label>
              <input
                v-model="formData[field.key]"
                :type="field.type || 'text'"
                :required="field.required"
                :maxlength="field.maxLength"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </template>
          </div>

          <div v-if="readonlyFields.length" class="border-t border-slate-200 pt-4 mt-2 space-y-3">
            <div v-for="rf in readonlyFields" :key="rf.label">
              <label class="block text-xs font-medium text-slate-400 mb-1">{{ rf.label }}</label>
              <p class="text-sm text-slate-600">{{ rf.value }}</p>
            </div>
          </div>

        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <FormErrorBanner :message="error" />
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="saving || hasError"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import { useFormError } from '../../composables/useFormError';
import FormErrorBanner from '../shared/FormErrorBanner.vue';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
}

// This modal delegates the actual save to its parent via emit('submit', …), so it doesn't do its own
// async call — hence useFormError (validation + shared banner) rather than the full useModalForm.
export default defineComponent({
  name: 'LookupFormModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    title: { type: String, required: true },
    fields: { type: Array as PropType<FieldDef[]>, required: true },
    initialValues: { type: Object as PropType<Record<string, string> | null>, default: null },
    readonlyFields: { type: Array as PropType<{ label: string; value: string }[]>, default: () => [] },
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const saving = ref(false);
    const { message: error, hasError, setError, clear: clearError } = useFormError();
    const formData = reactive<Record<string, string | number | boolean>>({});

    watch(formData, () => clearError(), { deep: true });

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        for (const field of props.fields) {
          // WP-39: checkbox fields carry booleans (initialValues serialize them as 'true'/'false')
          formData[field.key] = field.type === 'checkbox'
            ? props.initialValues?.[field.key] === 'true'
            : props.initialValues?.[field.key] ?? '';
        }
      }
    );

    const handleSubmit = () => {
      // Validate required fields
      for (const field of props.fields) {
        const val = formData[field.key];
        if (field.required && (val === undefined || val === null || String(val).trim() === '')) {
          setError(`${field.label} is required.`);
          return;
        }
      }

      saving.value = true;
      clearError();
      const data: Record<string, string | number | boolean> = {};
      for (const field of props.fields) {
        const val = formData[field.key];
        if (field.type === 'checkbox') {
          data[field.key] = val === true; // always sent — an unchecked box is an explicit false
          continue;
        }
        if (val === undefined || val === null || String(val).trim() === '') continue;
        data[field.key] = field.type === 'number' ? Number(val) : String(val).trim();
      }
      emit('submit', data);
      saving.value = false;
    };

    return { formData, saving, error, hasError, handleSubmit };
  },
});
</script>
