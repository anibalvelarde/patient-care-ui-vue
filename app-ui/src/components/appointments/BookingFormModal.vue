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
            <p v-if="caretakerWarning" class="mt-1 text-xs text-amber-600">
              This patient has no caretaker assigned. Please assign one first.
            </p>
          </div>

          <!-- Therapist -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Therapist</label>
            <select v-model="form.therapistId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
              <option :value="0" disabled>Select therapist...</option>
              <option v-for="t in therapists" :key="t.therapistId" :value="t.therapistId">
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
              <input v-model="form.sessionTime" type="time" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
          </div>

          <!-- Specialty Type & Duration -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Specialty Type</label>
              <select v-model="form.specialtyTypeId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                <option :value="0" disabled>Select specialty...</option>
                <optgroup v-if="qualifiedSpecialties.length > 0" label="Qualified">
                  <option v-for="s in qualifiedSpecialties" :key="s.id" :value="s.id">
                    {{ s.abbreviation }} — {{ s.name }}
                  </option>
                </optgroup>
                <optgroup v-if="unqualifiedSpecialties.length > 0" :label="form.therapistId > 0 ? 'Not certified' : 'All specialties'">
                  <option v-for="s in unqualifiedSpecialties" :key="s.id" :value="s.id">
                    {{ s.abbreviation }} — {{ s.name }}
                  </option>
                </optgroup>
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
              <input v-model.number="form.discount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Provider Amt</label>
              <input v-model.number="form.providerAmount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500" placeholder="Optional notes..."></textarea>
          </div>

          <!-- Error -->
          <div v-if="saveError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">{{ saveError }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="saving || !isValid"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              saving || !isValid
                ? 'bg-violet-300 text-white cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700',
            ]"
          >
            {{ saving ? 'Saving...' : (isWalkIn ? 'Check In Walk-In' : 'Book Appointment') }}
          </button>
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

export default defineComponent({
  name: 'BookingFormModal',
  props: {
    visible: { type: Boolean, required: true },
    isWalkIn: { type: Boolean, default: false },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
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

    const selectedTherapistSpecialtyIds = computed(() => {
      if (form.value.therapistId <= 0) return new Set<number>();
      const therapist = therapists.value.find(t => t.therapistId === form.value.therapistId);
      return new Set(therapist?.specialties.map(s => s.specialtyId) ?? []);
    });

    const qualifiedSpecialties = computed(() => {
      if (selectedTherapistSpecialtyIds.value.size === 0) return [];
      return specialtyTypes.value.filter(s => selectedTherapistSpecialtyIds.value.has(s.id));
    });

    const unqualifiedSpecialties = computed(() => {
      if (selectedTherapistSpecialtyIds.value.size === 0) return specialtyTypes.value;
      return specialtyTypes.value.filter(s => !selectedTherapistSpecialtyIds.value.has(s.id));
    });

    const isValid = computed(() => {
      return form.value.patientId > 0 && form.value.therapistId > 0 && form.value.specialtyTypeId > 0;
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

    watch(() => form.value.patientId, checkCaretaker);

    watch(() => props.visible, (val) => {
      if (val) {
        loadDropdowns();
        saveError.value = '';
        form.value = {
          patientId: 0,
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

    return { form, patients, therapists, specialtyTypes, qualifiedSpecialties, unqualifiedSpecialties, saving, saveError, caretakerWarning, isValid, handleSubmit };
  },
});
</script>
