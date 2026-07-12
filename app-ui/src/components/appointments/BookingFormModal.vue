<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
      <div class="relative w-full max-w-lg bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isWalkIn ? 'Walk-In Patient' : 'Book Appointment' }}
          </h2>
          <button @click="$emit('close')" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <!-- Patient -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <select v-model="form.patientId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
              <option :value="0" disabled>Select patient...</option>
              <option v-for="p in patients" :key="p.patientId" :value="p.patientId">
                {{ p.patientName }}
              </option>
            </select>
            <!-- WP-23 (F10): hard block — was a soft amber warning pre-WP-23 -->
            <p v-if="caretakerWarning" class="mt-1 text-xs font-medium text-red-600">
              Booking blocked — this patient has no caretaker on file. Link a caretaker first.
            </p>
          </div>

          <!-- Discovery-first banner -->
          <div v-if="needsDiscovery" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="flex items-start">
              <svg class="w-4 h-4 text-amber-600 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="text-sm text-amber-800 font-medium">This patient needs a discovery session first.</span>
                <span class="text-xs text-amber-600 block mt-1">Only discovery specialties are available for booking.</span>
              </div>
            </div>
          </div>

          <!-- Therapist -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Therapist</label>
            <select v-model="form.therapistId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
              <option :value="0" disabled>Select therapist...</option>
              <option v-for="t in filteredTherapists" :key="t.therapistId" :value="t.therapistId">
                {{ t.therapistName }}
              </option>
            </select>
          </div>

          <!-- Date & Time -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input v-model="form.sessionDate" type="date" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <input v-model="form.sessionTime" type="time" :min="timeMin" :max="timeMax" :step="timeStep" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
          </div>

          <!-- Specialty Type & Duration -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Specialty Type</label>
              <select v-model="form.specialtyTypeId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                <option :value="0" disabled>Select specialty...</option>
                <option v-for="s in filteredSpecialties" :key="s.id" :value="s.id">
                  {{ s.abbreviation }} — {{ s.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
              <input v-model.number="form.duration" type="number" min="15" step="15" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
          </div>

          <!-- Amount & Discount -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input v-model.number="form.amount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Discount</label>
              <!-- WP-23 (F7): min rides the SENADIS floor; the clamp re-applies on amount/patient change and at submit -->
              <input v-model.number="form.discount" type="number" :min="senadisFloor" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
              <p v-if="senadisPatient" class="mt-1 text-xs text-violet-600">SENADIS: min {{ senadisFloor.toFixed(2) }} (20%)</p>
            </div>
            <!-- WP-17C: cosmetic only — the API still returns ProviderAmount to anyone with Appointments.View; true field-level enforcement needs API response-shaping (deferred). -->
            <div v-if="hasClaim('Permission', Permissions.AppointmentsProviderAmount)">
              <label class="block text-sm font-medium text-slate-700 mb-1">Provider Amt</label>
              <input v-model.number="form.providerAmount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" placeholder="Optional notes..."></textarea>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <div v-if="saveError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">{{ saveError }}</p>
          </div>
          <div class="flex items-center justify-end space-x-3">
            <button @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button
              v-if="hasClaim('Permission', Permissions.AppointmentsBook)"
              @click="handleSubmit"
              :disabled="saving || !isValid || !!saveError"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                saving || !isValid || !!saveError
                  ? 'bg-violet-300 text-white cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700',
              ]"
            >
              {{ saving ? 'Saving...' : (isWalkIn ? 'Check In Walk-In' : 'Book Appointment') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { TherapistsHttpClient } from '../../services/TherapistsHttpClient';
import { LookupHttpClient } from '../../services/LookupHttpClient';
import type { SessionEventRequest } from '../../interfaces/Appointment';
import type { Patient } from '../../interfaces/Patient';
import type { Therapist } from '../../interfaces/Therapist';
import type { LookupItem } from '../../interfaces/Lookups';
import { isDiscoverySpecialty } from '../../interfaces/TreatmentPlan';
import { TIME_MIN, TIME_MAX, TIME_STEP } from '../../utils/timeSlots';
import { useClaims, Permissions } from '../../composables/useClaims';
import { useNotificationsStore } from '../../stores/notifications';

export default defineComponent({
  name: 'BookingFormModal',
  props: {
    visible: { type: Boolean, required: true },
    isWalkIn: { type: Boolean, default: false },
    preSelectPatientId: { type: Number, default: 0 },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { hasClaim } = useClaims();
    const sessionsClient = new SessionsHttpClient();
    const patientsClient = new PatientsHttpClient();
    const therapistsClient = new TherapistsHttpClient();
    const lookupClient = new LookupHttpClient();

    const patients = ref<Patient[]>([]);
    const therapists = ref<Therapist[]>([]);
    const specialtyTypes = ref<LookupItem[]>([]);
    const saving = ref(false);
    const saveError = ref('');
    const caretakerWarning = ref(false);
    const needsDiscovery = ref(false);
    const senadisPatient = ref(false);
    const notifications = useNotificationsStore();

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const form = ref({
      patientId: 0,
      therapistId: 0,
      sessionDate: today,
      sessionTime: nowTime,
      specialtyTypeId: 0,
      duration: 60,
      amount: 0,
      discount: 0,
      providerAmount: 0,
      notes: '',
    });

    // Bidirectional filtering: specialty ↔ therapist (with discovery-first)
    const filteredSpecialties = computed(() => {
      let specs = specialtyTypes.value;
      // WP-17C F1: cosmetic only. Discovery sessions are still creatable by FD via the normal POST /api/sessions booking flow; the real fix (a dedicated discovery-start endpoint, or relaxing the matrix to allow FD) is deferred to the discovery-first workflow. Hiding the option here is presentation, not enforcement.
      if (!hasClaim('Permission', Permissions.PatientsStartDiscovery)) {
        specs = specs.filter(s => !isDiscoverySpecialty(s.abbreviation));
      }
      // Discovery-first: only discovery types when patient needs discovery
      if (needsDiscovery.value) {
        specs = specs.filter(s => isDiscoverySpecialty(s.abbreviation));
      }
      // Therapist-based filtering
      if (form.value.therapistId > 0) {
        const therapist = therapists.value.find(t => t.therapistId === form.value.therapistId);
        if (therapist && therapist.specialties.length > 0) {
          const qualifiedIds = new Set(therapist.specialties.map(s => s.specialtyId));
          specs = specs.filter(s => qualifiedIds.has(s.id));
        }
      }
      return specs;
    });

    const filteredTherapists = computed(() => {
      let pool = therapists.value;
      // Discovery-first: only therapists qualified in discovery specialties
      if (needsDiscovery.value) {
        const discoverySpecialtyIds = new Set(
          specialtyTypes.value.filter(s => isDiscoverySpecialty(s.abbreviation)).map(s => s.id)
        );
        pool = pool.filter(t => t.specialties.some(s => discoverySpecialtyIds.has(s.specialtyId)));
      }
      // Specialty-based filtering
      if (form.value.specialtyTypeId > 0) {
        pool = pool.filter(t => t.specialties.some(s => s.specialtyId === form.value.specialtyTypeId));
      }
      return pool;
    });

    // Reset the other selection when it becomes invalid after filtering
    watch(() => form.value.therapistId, () => {
      if (form.value.specialtyTypeId > 0 && !filteredSpecialties.value.some(s => s.id === form.value.specialtyTypeId)) {
        form.value.specialtyTypeId = 0;
      }
    });

    watch(() => form.value.specialtyTypeId, (id) => {
      if (form.value.therapistId > 0 && !filteredTherapists.value.some(t => t.therapistId === form.value.therapistId)) {
        form.value.therapistId = 0;
      }
      // WP-23 (F6): pre-fill Amount from the specialty's default price — refills on every
      // specialty change (user-editable after; NULL default = leave the amount alone).
      if (id > 0) {
        const specialty = specialtyTypes.value.find(s => s.id === id);
        if (specialty?.defaultAmount != null) {
          form.value.amount = specialty.defaultAmount;
        }
      }
    });

    // WP-23 (F7): statutory SENADIS floor — 20% of Amount, 2dp; 0 for unflagged patients.
    const senadisFloor = computed(() =>
      senadisPatient.value ? Math.round(0.20 * form.value.amount * 100) / 100 : 0
    );

    const applySenadisFloor = () => {
      if (senadisPatient.value && form.value.discount < senadisFloor.value) {
        form.value.discount = senadisFloor.value;
      }
    };

    // WP-23 (F10): the caretaker check is now a hard block (was a soft warning) — the API
    // enforces the same rule with a 400, this keeps the modal honest before submit.
    const isValid = computed(() => {
      return form.value.patientId > 0 && form.value.therapistId > 0 && form.value.specialtyTypeId > 0
        && !caretakerWarning.value;
    });

    const loadDropdowns = async () => {
      try {
        const [p, t, s] = await Promise.all([
          patientsClient.getPatients(),
          therapistsClient.getTherapists(),
          lookupClient.getAll('specialty-types'),
        ]);
        patients.value = p.sort((a, b) => a.patientName.localeCompare(b.patientName));
        therapists.value = t.sort((a, b) => a.therapistName.localeCompare(b.therapistName));
        specialtyTypes.value = s.sort((a, b) => a.sortOrder - b.sortOrder || a.abbreviation.localeCompare(b.abbreviation));
      } catch {
        // Silently fail — dropdowns will be empty
      }
    };

    const checkCaretaker = async (patientId: number) => {
      if (patientId <= 0) { caretakerWarning.value = false; return; }
      try {
        const caretakers = await patientsClient.getPatientCaretakers(patientId);
        caretakerWarning.value = caretakers.length === 0;
      } catch {
        caretakerWarning.value = false;
      }
    };

    const checkDiscovery = async (patientId: number) => {
      if (patientId <= 0) { needsDiscovery.value = false; senadisPatient.value = false; return; }
      try {
        const patient = await patientsClient.getPatient(patientId);
        needsDiscovery.value = patient.hasCompletedDiscovery === false;
        // WP-23 (F7): same fetched profile carries the SENADIS flag — one toast per
        // patient selection, then clamp the discount up to the floor.
        senadisPatient.value = patient.hasSenadisDiscount === true;
        if (senadisPatient.value) {
          notifications.info('SENADIS: statutory 20% discount applied — it cannot be reduced.');
          applySenadisFloor();
        }
      } catch {
        needsDiscovery.value = false; // Fail open — don't block booking
        senadisPatient.value = false; // (the API floors server-side regardless)
      }
    };

    watch(() => form.value.patientId, (id) => { checkCaretaker(id); checkDiscovery(id); });
    // WP-23 (F7): re-clamp when the amount moves the floor.
    watch(() => form.value.amount, applySenadisFloor);
    watch(form, () => { saveError.value = ''; }, { deep: true });

    watch(() => props.visible, (val) => {
      if (val) {
        loadDropdowns();
        saveError.value = '';
        needsDiscovery.value = false;
        senadisPatient.value = false;
        form.value = {
          patientId: props.preSelectPatientId || 0,
          therapistId: 0,
          sessionDate: props.isWalkIn ? today : today,
          sessionTime: props.isWalkIn ? nowTime : '09:00',
          specialtyTypeId: 0,
          duration: 60,
          amount: 0,
          discount: 0,
          providerAmount: 0,
          notes: props.isWalkIn ? 'Walk-in patient' : '',
        };
      }
    });

    const handleSubmit = async () => {
      saving.value = true;
      saveError.value = '';
      applySenadisFloor(); // WP-23 (F7): last-line clamp; the API floors server-side too
      try {
        const request: SessionEventRequest = {
          sessionDate: form.value.sessionDate,
          sessionTime: form.value.sessionTime + ':00',
          patientId: form.value.patientId,
          therapistId: form.value.therapistId,
          therapyType: 'N/A', // backward compat — API resolves from specialtyTypeId
          duration: form.value.duration,
          amount: form.value.amount,
          discount: form.value.discount,
          providerAmount: form.value.providerAmount,
          isPaidOff: false,
          notes: form.value.notes,
          appointmentStatusId: props.isWalkIn ? 6 : 1, // CheckedIn for walk-in, Proposed for booking
          specialtyTypeId: form.value.specialtyTypeId,
        };
        await sessionsClient.createSession(request);
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Failed to save appointment.';
      } finally {
        saving.value = false;
      }
    };

    return { form, patients, filteredTherapists, filteredSpecialties, saving, saveError, caretakerWarning, needsDiscovery, senadisPatient, senadisFloor, isValid, handleSubmit, timeMin: TIME_MIN, timeMax: TIME_MAX, timeStep: TIME_STEP, hasClaim, Permissions };
  },
});
</script>
