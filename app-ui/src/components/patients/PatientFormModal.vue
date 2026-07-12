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
            <p v-if="age" class="mt-1 text-xs text-slate-400">Age: {{ age }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Cedula</label>
            <input
              v-model="form.cedula"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Government ID (optional)"
            />
          </div>

          <!-- WP-23 (F7): SENADIS flag — free at create; on edit this is the app's first
               in-modal claim gate (Patients.SenadisDiscount.Edit, MGR/AM only) -->
          <div class="space-y-1">
            <label class="flex items-center space-x-2 cursor-pointer" :class="{ 'cursor-not-allowed opacity-60': !canEditSenadis }">
              <input
                v-model="form.hasSenadisDiscount"
                type="checkbox"
                :disabled="!canEditSenadis"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span class="text-sm font-medium text-slate-700">SENADIS discount (statutory 20%)</span>
            </label>
            <p v-if="form.hasSenadisDiscount && canEditSenadis" class="text-xs text-slate-400">
              A 20% discount floor auto-applies to this patient's bookings.
            </p>
            <p v-if="!canEditSenadis" class="text-xs text-slate-400">
              Only Managers / Assistant Managers can change the SENADIS flag.
            </p>
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
            <p class="mt-1 text-xs text-slate-400">
              Leave blank to assign a temporary MRN. Patient will be inactive until a permanent MRN is provided.
            </p>
          </div>

          <div v-if="isEdit">
            <label class="block text-sm font-medium text-slate-700 mb-1">MRN</label>
            <input
              v-model="form.medicalRecordNumber"
              type="text"
              :class="[
                'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent',
                hasTemporaryMrn
                  ? 'border-amber-300 bg-amber-50 focus:ring-amber-500'
                  : 'border-slate-300 focus:ring-blue-500',
              ]"
              placeholder="Enter MRN"
            />
            <p v-if="hasTemporaryMrn" class="mt-1 text-xs text-amber-600">
              This patient has a temporary MRN. Assign a permanent MRN to enable activation.
            </p>
            <p v-else class="mt-1 text-xs text-slate-400">
              Changing the MRN must keep it unique; leave blank to keep the current one.
            </p>
          </div>

          <div v-if="isEdit" class="space-y-1">
            <div class="flex items-center space-x-3">
              <label class="text-sm font-medium text-slate-700">Active Status</label>
              <button
                type="button"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  cannotActivate ? 'bg-slate-200 cursor-not-allowed' :
                  form.activeStatus ? 'bg-blue-600' : 'bg-slate-300',
                ]"
                :disabled="cannotActivate"
                @click="cannotActivate || (form.activeStatus = !form.activeStatus)"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    form.activeStatus ? 'translate-x-6' : 'translate-x-1',
                  ]"
                />
              </button>
            </div>
            <p v-if="cannotActivate" class="text-xs text-amber-600">
              Cannot activate with a temporary MRN. Enter a permanent MRN above first.
            </p>
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
              {{ saving ? 'Saving...' : 'Save Patient' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, watch, type PropType } from 'vue';
import type { Patient } from '../../interfaces/Patient';
import { isTemporaryMrn } from '../../interfaces/Patient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { formatAge } from '../../utils/age';
import { useClaims, Permissions } from '../../composables/useClaims';

function parseName(patientName: string) {
  const [last, rest] = patientName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

function formatDobForInput(dob: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDobForApi(dob: string): string {
  if (!dob) return '';
  // HTML date inputs give yyyy-MM-dd; .NET API needs DateTime format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return `${dob}T00:00:00`;
  // Handle full datetime strings — reparse to ensure 4-digit year
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00`;
}

export default defineComponent({
  name: 'PatientFormModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    patient: { type: Object as PropType<Patient | null>, default: null },
  },
  emits: ['close', 'saved', 'created-temp-mrn'],
  setup(props, { emit }) {
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();
    const { hasClaim } = useClaims();

    const form = reactive({
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phoneNumber: '',
      gender: '',
      medicalRecordNumber: '',
      cedula: '',
      hasSenadisDiscount: false,
      activeStatus: true,
    });

    const isEdit = ref(false);

    // WP-23 (F7): anyone who can create patients may SET the flag at create; changing it on an
    // existing patient needs the claim (Questionnaire E). The payload omits the field when
    // disabled — the API's field-level gate would 403 a change from an unauthorized role anyway.
    const canEditSenadis = computed(
      () => !isEdit.value || hasClaim('Permission', Permissions.PatientsSenadisDiscountEdit)
    );

    // Blank on edit means "keep the current MRN", so temp-ness is judged on the effective value.
    const effectiveMrn = computed(
      () => form.medicalRecordNumber.trim() || props.patient?.medicalRecordNumber || ''
    );
    const hasTemporaryMrn = computed(() => isEdit.value && isTemporaryMrn(effectiveMrn.value));
    const cannotActivate = computed(() => hasTemporaryMrn.value && !form.activeStatus);
    const age = computed(() => formatAge(form.dateOfBirth));

    watch(form, () => clearError(), { deep: true });

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        if (props.patient) {
          isEdit.value = true;
          const parsed = parseName(props.patient.patientName);
          form.firstName = parsed.firstName;
          form.middleName = parsed.middleName;
          form.lastName = parsed.lastName;
          form.dateOfBirth = formatDobForInput(props.patient.dateOfBirth);
          form.email = props.patient.email ?? '';
          form.phoneNumber = props.patient.phoneNumber ?? '';
          form.gender = props.patient.gender ?? '';
          form.medicalRecordNumber = props.patient.medicalRecordNumber ?? '';
          form.cedula = props.patient.cedula ?? '';
          form.hasSenadisDiscount = props.patient.hasSenadisDiscount === true;
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
          form.cedula = '';
          form.hasSenadisDiscount = false;
          form.activeStatus = true;
        }
      }
    );

    const handleSubmit = () => {
      if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.email || !form.phoneNumber || !form.gender) {
        setError('Please fill in all required fields.');
        return;
      }
      // Cannot activate a patient while a temporary MRN is still in place.
      if (isEdit.value && props.patient && form.activeStatus && isTemporaryMrn(effectiveMrn.value)) {
        setError('Cannot activate a patient with a temporary MRN. Assign a permanent MRN first.');
        return;
      }
      return submit(async () => {
        const client = new PatientsHttpClient();
        if (isEdit.value && props.patient) {
          const originalMrn = props.patient.medicalRecordNumber || '';
          // MRN is generally editable (B2): send a changed, non-blank value; blank keeps the
          // current MRN (the API treats an omitted/empty MRN as "leave as-is"; uniqueness → 409).
          const newMrn = form.medicalRecordNumber.trim();
          const mrnChanged = newMrn !== '' && newMrn !== originalMrn;
          const assigningPermanentMrn = isTemporaryMrn(originalMrn) && mrnChanged && !isTemporaryMrn(newMrn);
          const baseFields = {
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: formatDobForApi(form.dateOfBirth),
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            // Always send the field on update: '' expresses an explicit clear-to-NULL (the API
            // treats omitted = leave as-is, blank = erase — intake 2026-06-29-001 item 3).
            cedula: form.cedula.trim(),
            // WP-23 (F7): only send when this user may edit it — omitted = unchanged server-side.
            hasSenadisDiscount: canEditSenadis.value ? form.hasSenadisDiscount : undefined,
          };

          if (assigningPermanentMrn && form.activeStatus) {
            // Two-step: first assign permanent MRN (keep inactive), then activate
            await client.updatePatient(props.patient.patientId, {
              ...baseFields,
              activeStatus: false,
              medicalRecordNumber: newMrn,
            });
            await client.updatePatient(props.patient.patientId, {
              ...baseFields,
              activeStatus: true,
            });
          } else {
            await client.updatePatient(props.patient.patientId, {
              ...baseFields,
              activeStatus: form.activeStatus,
              medicalRecordNumber: mrnChanged ? newMrn : undefined,
            });
          }
        } else {
          const created = await client.createPatient({
            firstName: form.firstName,
            middleName: form.middleName || undefined,
            lastName: form.lastName,
            dateOfBirth: formatDobForApi(form.dateOfBirth),
            email: form.email,
            phoneNumber: form.phoneNumber,
            gender: form.gender,
            medicalRecordNumber: form.medicalRecordNumber || undefined,
            cedula: form.cedula || undefined,
            hasSenadisDiscount: form.hasSenadisDiscount,
          });
          if (isTemporaryMrn(created.medicalRecordNumber ?? '')) {
            emit('created-temp-mrn', created);
          }
        }
        emit('saved');
        emit('close');
      });
    };

    return { form, isEdit, saving, error, hasError, hasTemporaryMrn, cannotActivate, canEditSenadis, age, handleSubmit };
  },
});
</script>
