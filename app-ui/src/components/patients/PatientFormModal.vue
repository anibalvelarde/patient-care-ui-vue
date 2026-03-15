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
            {{ isEdit ? 'Edit Patient' : 'Add Patient' }}
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

          <div v-if="!isEdit">
            <label class="block text-sm font-medium text-slate-700 mb-1">MRN</label>
            <input
              v-model="form.medicalRecordNumber"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto-generated if blank"
            />
          </div>

          <div v-if="isEdit" class="flex items-center space-x-3">
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
            {{ saving ? 'Saving...' : 'Save Patient' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import type { Patient } from '../../interfaces/Patient';

function parseName(patientName: string) {
  const [last, rest] = patientName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

function formatDobForInput(dob: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default defineComponent({
  name: 'PatientFormModal',
  props: {
    visible: { type: Boolean, required: true },
    patient: { type: Object as PropType<Patient | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const saving = ref(false);
    const error = ref('');

    const form = reactive({
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phoneNumber: '',
      gender: '',
      medicalRecordNumber: '',
      activeStatus: true,
    });

    const isEdit = ref(false);

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        error.value = '';
        if (props.patient) {
          isEdit.value = true;
          const parsed = parseName(props.patient.patientName);
          form.firstName = parsed.firstName;
          form.middleName = parsed.middleName;
          form.lastName = parsed.lastName;
          form.dateOfBirth = formatDobForInput(props.patient.dateOfBirth);
          form.email = props.patient.email;
          form.phoneNumber = props.patient.phoneNumber;
          form.gender = props.patient.gender;
          form.activeStatus = props.patient.isActive;
        } else {
          isEdit.value = false;
          form.firstName = '';
          form.middleName = '';
          form.lastName = '';
          form.dateOfBirth = '';
          form.email = '';
          form.phoneNumber = '';
          form.gender = '';
          form.medicalRecordNumber = '';
          form.activeStatus = true;
        }
      }
    );

    const handleSubmit = async () => {
      if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.email || !form.phoneNumber || !form.gender) {
        error.value = 'Please fill in all required fields.';
        return;
      }
      saving.value = true;
      error.value = '';
      try {
        if (isEdit.value && props.patient) {
          const { PatientsHttpClient } = await import('../../services/PatientsHttpClient');
          const client = new PatientsHttpClient();
          await client.updatePatient(props.patient.patientId, {
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            activeStatus: form.activeStatus,
          });
        } else {
          const { PatientsHttpClient } = await import('../../services/PatientsHttpClient');
          const client = new PatientsHttpClient();
          await client.createPatient({
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            medicalRecordNumber: form.medicalRecordNumber || undefined,
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

    return { form, isEdit, saving, error, handleSubmit };
  },
});
</script>
