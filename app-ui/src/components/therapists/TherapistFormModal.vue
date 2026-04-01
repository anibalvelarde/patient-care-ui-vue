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
            {{ isEdit ? 'Edit Therapist' : 'Add Therapist' }}
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

          <!-- Profile Accordion Section -->
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              @click="profileSectionOpen = !profileSectionOpen"
            >
              <span class="text-sm font-semibold text-slate-700">Profile</span>
              <svg
                class="w-4 h-4 text-slate-500 transition-transform duration-200"
                :class="{ 'rotate-180': profileSectionOpen }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              class="overflow-hidden transition-all duration-200"
              :class="profileSectionOpen ? 'max-h-[800px]' : 'max-h-0'"
            >
              <div class="px-4 py-4 space-y-4">
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
                  <label class="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    v-model="form.dateOfBirth"
                    type="date"
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
                  <label class="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    v-model="form.gender"
                    required
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Fee/Session ($) *</label>
                    <input
                      v-model.number="form.feePerSession"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Fee % *</label>
                    <input
                      v-model.number="form.feePctPerSession"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div v-if="isEdit" class="space-y-1">
                  <div class="flex items-center space-x-3">
                    <label class="text-sm font-medium text-slate-700">Active Status</label>
                    <button
                      type="button"
                      :class="[
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        form.activeStatus ? 'bg-blue-600' : 'bg-slate-300',
                      ]"
                      @click="form.activeStatus = !form.activeStatus"
                    >
                      <span
                        :class="[
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          form.activeStatus ? 'translate-x-6' : 'translate-x-1',
                        ]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Specialties Accordion Section -->
          <div class="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              @click="specialtiesSectionOpen = !specialtiesSectionOpen"
            >
              <span class="text-sm font-semibold text-slate-700">Specialties *</span>
              <svg
                class="w-4 h-4 text-slate-500 transition-transform duration-200"
                :class="{ 'rotate-180': specialtiesSectionOpen }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              class="overflow-hidden transition-all duration-200"
              :class="specialtiesSectionOpen ? 'max-h-96' : 'max-h-0'"
            >
              <div class="px-4 py-4 space-y-2">
                <div v-if="loadingSpecialties" class="text-sm text-slate-400 py-2">
                  Loading specialties...
                </div>
                <div v-else-if="specialtyOptions.length === 0" class="text-sm text-slate-400 py-2">
                  No specialty types available.
                </div>
                <label
                  v-for="option in specialtyOptions"
                  :key="option.id"
                  class="flex items-center space-x-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="selectedSpecialtyIds.has(option.id)"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    @change="toggleSpecialty(option.id)"
                  />
                  <span class="text-sm">
                    <span class="font-semibold text-slate-800">{{ option.abbreviation }}</span>
                    <span class="text-slate-600 ml-1">{{ option.name }}</span>
                  </span>
                </label>
                <div v-if="specialtyError" class="text-sm text-red-600 mt-2">
                  {{ specialtyError }}
                </div>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ error }}
          </div>
        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="saving"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            @click="handleSubmit"
          >
            {{ saving ? 'Saving...' : 'Save Therapist' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import type { Therapist } from '../../interfaces/Therapist';
import type { LookupItem } from '../../interfaces/Lookups';

function parseName(therapistName: string) {
  const [last, rest] = therapistName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

function formatDobForApi(dob: string): string {
  if (!dob) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return `${dob}T00:00:00`;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00`;
}

export default defineComponent({
  name: 'TherapistFormModal',
  props: {
    visible: { type: Boolean, required: true },
    therapist: { type: Object as PropType<Therapist | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const saving = ref(false);
    const error = ref('');
    const specialtyError = ref('');

    const profileSectionOpen = ref(true);
    const specialtiesSectionOpen = ref(true);

    const specialtyOptions = ref<LookupItem[]>([]);
    const loadingSpecialties = ref(false);
    const selectedSpecialtyIds = ref(new Set<number>());

    const form = reactive({
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phoneNumber: '',
      gender: '',
      feePerSession: 0,
      feePctPerSession: 0,
      activeStatus: true,
    });

    const isEdit = ref(false);

    const toggleSpecialty = (id: number) => {
      const next = new Set(selectedSpecialtyIds.value);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      selectedSpecialtyIds.value = next;
      if (next.size > 0) {
        specialtyError.value = '';
      }
    };

    const loadSpecialtyOptions = async () => {
      if (specialtyOptions.value.length > 0) return;
      loadingSpecialties.value = true;
      try {
        const { LookupHttpClient } = await import('../../services/LookupHttpClient');
        const client = new LookupHttpClient();
        specialtyOptions.value = await client.getAll('specialty-types');
      } catch {
        specialtyOptions.value = [];
      } finally {
        loadingSpecialties.value = false;
      }
    };

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        error.value = '';
        specialtyError.value = '';
        profileSectionOpen.value = true;
        specialtiesSectionOpen.value = true;

        loadSpecialtyOptions();

        if (props.therapist) {
          isEdit.value = true;
          const parsed = parseName(props.therapist.therapistName);
          form.firstName = parsed.firstName;
          form.middleName = parsed.middleName;
          form.lastName = parsed.lastName;
          form.dateOfBirth = '';
          form.email = props.therapist.email;
          form.phoneNumber = props.therapist.phoneNumber;
          form.gender = '';
          form.feePerSession = props.therapist.feePerSession;
          form.feePctPerSession = props.therapist.feePctPerSession;
          form.activeStatus = props.therapist.isActive;
          selectedSpecialtyIds.value = new Set(
            props.therapist.specialties?.map((s) => s.specialtyId) ?? []
          );
        } else {
          isEdit.value = false;
          form.firstName = '';
          form.middleName = '';
          form.lastName = '';
          form.dateOfBirth = '';
          form.email = '';
          form.phoneNumber = '';
          form.gender = '';
          form.feePerSession = 0;
          form.feePctPerSession = 0;
          form.activeStatus = true;
          selectedSpecialtyIds.value = new Set();
        }
      }
    );

    const handleSubmit = async () => {
      if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.email || !form.phoneNumber || !form.gender) {
        error.value = 'Please fill in all required fields.';
        return;
      }
      if (selectedSpecialtyIds.value.size === 0) {
        specialtyError.value = 'At least one specialty is required.';
        return;
      }
      saving.value = true;
      error.value = '';
      specialtyError.value = '';
      try {
        const { TherapistsHttpClient } = await import('../../services/TherapistsHttpClient');
        const client = new TherapistsHttpClient();
        const specialtyIds = Array.from(selectedSpecialtyIds.value);
        if (isEdit.value && props.therapist) {
          await client.updateTherapist(props.therapist.therapistId, {
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: formatDobForApi(form.dateOfBirth),
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            feePerSession: form.feePerSession,
            feePctPerSession: form.feePctPerSession,
            activeStatus: form.activeStatus,
            specialtyIds,
          });
        } else {
          await client.createTherapist({
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: formatDobForApi(form.dateOfBirth),
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            feePerSession: form.feePerSession,
            feePctPerSession: form.feePctPerSession,
            specialtyIds,
          });
        }
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'An error occurred while saving.';
      } finally {
        saving.value = false;
      }
    };

    return {
      form,
      isEdit,
      saving,
      error,
      specialtyError,
      profileSectionOpen,
      specialtiesSectionOpen,
      specialtyOptions,
      loadingSpecialties,
      selectedSpecialtyIds,
      toggleSpecialty,
      handleSubmit,
    };
  },
});
</script>
