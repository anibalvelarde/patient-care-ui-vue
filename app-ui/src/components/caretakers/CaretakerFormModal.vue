<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isEdit ? 'Edit Caretaker' : 'Add Caretaker' }}
          </h2>
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
          <!-- WP-27 (F8): create-new step of a cross-add chain — the saved caretaker auto-links -->
          <div
            v-if="linkTo && !isEdit"
            class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800"
            data-testid="chain-context-banner"
          >
            Will be linked to patient <strong>{{ linkTo.name }}</strong>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input
                v-model="form.firstName"
                type="text"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
              <input
                v-model="form.middleName"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
            <input
              v-model="form.lastName"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
            <input
              v-model="form.phoneNumber"
              type="tel"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>

          <!-- WP-27 (F8): link fields captured with the create and passed back on the `created`
               emit — the chain performs the actual link call after the caretaker exists. -->
          <div v-if="linkTo && !isEdit" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Relationship to {{ linkTo.name }}
              </label>
              <select
                v-model="linkRelationship"
                data-testid="chain-relationship-select"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option :value="null">None</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Relative">Relative</option>
                <option value="HiredHelp">Hired Help</option>
              </select>
            </div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="linkIsPrimary"
                type="checkbox"
                data-testid="chain-primary-checkbox"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-slate-700">Primary caretaker</span>
            </label>
          </div>

          <div v-if="isEdit" class="space-y-1">
            <div class="flex items-center space-x-3">
              <label class="text-sm font-medium text-slate-700">Active Status</label>
              <button
                type="button"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  form.isActive ? 'bg-blue-600' : 'bg-slate-300',
                ]"
                @click="form.isActive = !form.isActive"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    form.isActive ? 'translate-x-6' : 'translate-x-1',
                  ]"
                />
              </button>
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
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save Caretaker' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import type { Caretaker } from '../../interfaces/Caretaker';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';

function parseName(caretakerName: string) {
  const [last, rest] = caretakerName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

export default defineComponent({
  name: 'CaretakerFormModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    caretaker: { type: Object as PropType<Caretaker | null>, default: null },
    // WP-27 (F8): set when this modal is the create-new step of a cross-add chain — shows the
    // context banner + relationship/primary fields and enriches the `created` emit.
    linkTo: { type: Object as PropType<{ name: string } | null>, default: null },
  },
  emits: ['close', 'saved', 'created'],
  setup(props, { emit }) {
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();

    const form = reactive({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      notes: '',
      isActive: true,
    });

    const isEdit = ref(false);

    // WP-27 (F8): link fields shown only when opened as a chain's create-new step (linkTo set).
    const linkRelationship = ref<string | null>(null);
    const linkIsPrimary = ref(true);

    watch(form, () => clearError(), { deep: true });

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        if (props.caretaker) {
          isEdit.value = true;
          const parsed = parseName(props.caretaker.caretakerName);
          form.firstName = parsed.firstName;
          form.middleName = parsed.middleName;
          form.lastName = parsed.lastName;
          form.email = props.caretaker.email ?? '';
          form.phoneNumber = props.caretaker.phoneNumber ?? '';
          form.notes = props.caretaker.notes;
          form.isActive = props.caretaker.isActive;
        } else {
          isEdit.value = false;
          form.firstName = '';
          form.middleName = '';
          form.lastName = '';
          form.email = '';
          form.phoneNumber = '';
          form.notes = '';
          form.isActive = true;
          linkRelationship.value = null;
          linkIsPrimary.value = true;
        }
      }
    );

    const handleSubmit = () => {
      if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber) {
        setError('Please fill in all required fields.');
        return;
      }
      return submit(async () => {
        const client = new CaretakersHttpClient();
        if (isEdit.value && props.caretaker) {
          await client.updateCaretaker(props.caretaker.caretakerId, {
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            notes: form.notes || undefined,
            isActive: form.isActive,
          });
        } else {
          const created = await client.createCaretaker({
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            notes: form.notes || undefined,
            isActive: true,
          });
          // WP-27: hand the created record (plus chain link fields when applicable) to the
          // parent — CaretakersView starts the F9 chain; CrossAddChainModal performs the F8 link.
          emit('created', {
            record: created,
            link: props.linkTo ? { relationship: linkRelationship.value, isPrimary: linkIsPrimary.value } : null,
          });
        }
        emit('saved');
        emit('close');
      });
    };

    return { form, isEdit, saving, error, hasError, linkRelationship, linkIsPrimary, handleSubmit };
  },
});
</script>
