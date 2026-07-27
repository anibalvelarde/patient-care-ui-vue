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
          <!-- Patient (WP-30: lookup typeahead — was a full-census dropdown) -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <LookupSelect
              v-model="selectedPatient"
              placeholder="Search patient by name, MRN, or cedula…"
              :fetch-options="fetchPatientOptions"
              test-id="booking-patient"
            />
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
              <!-- WP-40 (BK-1): fixed bookable durations — the API 400s anything else. -->
              <select v-model.number="form.duration" data-testid="duration-select" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                <option v-for="d in bookableDurations" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>

          <!-- WP-40 (BK-2): money is DERIVED, read-only — Amount from the WP-39 price sheet
               (duration row → default), Discount from SENADIS applicability, ProviderAmt from
               the therapist's fee model. The API re-derives authoritatively at booking. -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <p data-testid="derived-amount" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {{ derivedAmount != null ? '$' + derivedAmount.toFixed(2) : '—' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Discount</label>
              <p data-testid="derived-discount" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                ${{ derivedDiscount.toFixed(2) }}
              </p>
            </div>
            <!-- WP-17C: cosmetic only — true field-level enforcement is the API's ProviderAmount response-shaping. -->
            <div v-if="hasClaim('Permission', Permissions.AppointmentsProviderAmount)">
              <label class="block text-sm font-medium text-slate-700 mb-1">Provider Amt</label>
              <p data-testid="derived-provider-amount" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                ${{ derivedProviderAmount.toFixed(2) }}
              </p>
            </div>
          </div>

          <!-- WP-40 money signals -->
          <div class="space-y-1">
            <p v-if="missingPrice" data-testid="missing-price-block" class="text-xs font-medium text-red-600">
              No price configured for {{ selectedSpecialty?.name }} at {{ form.duration }} min — ask a manager to set it in Admin.
            </p>
            <p v-else-if="amountSource === 'defaultAmount'" data-testid="default-amount-badge" class="text-xs font-medium text-amber-600">
              No pricing configured for this specialty/duration — using the default amount.
            </p>
            <p v-if="senadisActive" data-testid="senadis-applied-badge" class="text-xs text-violet-600">
              SENADIS 20% applied ({{ derivedDiscount.toFixed(2) }})
            </p>
            <p v-else-if="senadisExpired" data-testid="senadis-expired-badge" class="text-xs font-medium text-amber-600">
              SENADIS expired {{ formatSenadisExpiry(senadisExpiry) }} — no discount for this session date.
            </p>
          </div>

          <!-- WP-40 on-site leg (dormant until OfferedOnSite flags flip) -->
          <div v-if="selectedSpecialty?.offeredOnSite" class="rounded-lg border border-slate-200 p-3 space-y-2">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="onSiteVisit" type="checkbox" data-testid="onsite-checkbox" class="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
              On-site visit (domiciliar)
            </label>
            <div v-if="onSiteVisit" class="space-y-1">
              <select v-model.number="onSiteSiteId" data-testid="onsite-site-select" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option :value="0" disabled>Select site...</option>
                <option v-for="s in sites" :key="s.siteId" :value="s.siteId">{{ s.siteName }}</option>
              </select>
              <p v-if="onSiteSiteId > 0" data-testid="onsite-charge-line" class="text-xs text-slate-600">
                On-site visit charge: ${{ onSiteTripCharge.toFixed(2) }}
              </p>
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
import { SitesHttpClient } from '../../services/SitesHttpClient';
import type { SessionEventRequest } from '../../interfaces/Appointment';
import type { Therapist } from '../../interfaces/Therapist';
import type { LookupItem } from '../../interfaces/Lookups';
import type { Site } from '../../interfaces/Site';
import { isDiscoverySpecialty } from '../../interfaces/TreatmentPlan';
import { TIME_MIN, TIME_MAX, TIME_STEP } from '../../utils/timeSlots';
import { useClaims, Permissions } from '../../composables/useClaims';
import { isSenadisExpired, formatSenadisExpiry } from '../../utils/senadis';
import LookupSelect, { type LookupOption } from '../shared/LookupSelect.vue';

// WP-40 (BK-1): the fixed bookable duration set — mirrors the API's validation
// ({30,40,45,60,90,120}; 40 added by the 2026-07-27 addendum for interview services).
export const BOOKABLE_DURATIONS = [30, 40, 45, 60, 90, 120];

export default defineComponent({
  name: 'BookingFormModal',
  components: { LookupSelect },
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
    const sitesClient = new SitesHttpClient();

    // WP-30: the patient picker is a lookup typeahead; the selection drives form.patientId.
    const selectedPatient = ref<LookupOption | null>(null);
    const therapists = ref<Therapist[]>([]);
    const specialtyTypes = ref<LookupItem[]>([]);
    const saving = ref(false);
    const saveError = ref('');
    const caretakerWarning = ref(false);
    const needsDiscovery = ref(false);
    const senadisPatient = ref(false);
    // WP-37 (SEN-1): the flagged patient's expiry as sent by the API ("...T00:00:00" | null).
    const senadisExpiry = ref<string | null>(null);
    // WP-40 on-site leg (dormant while all OfferedOnSite flags are 0).
    const onSiteVisit = ref(false);
    const onSiteSiteId = ref(0);
    const sites = ref<Site[]>([]);

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    // WP-40 (BK-2): no money fields in the form — Amount/Discount/ProviderAmt are derived.
    const form = ref({
      patientId: 0,
      therapistId: 0,
      sessionDate: today,
      sessionTime: nowTime,
      specialtyTypeId: 0,
      duration: 60,
      notes: '',
    });

    // Bidirectional filtering: specialty ↔ therapist (with discovery-first)
    const filteredSpecialties = computed(() => {
      let specs = specialtyTypes.value;
      // WP-24 (audit F1 closed): FD now HOLDS Patients.StartDiscovery (matrix hash 7ae3aa5e3274)
      // and the API enforces the claim imperatively on POST /api/sessions (403 without it) — this
      // filter is now backed by real enforcement, no longer cosmetic-only.
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

    const selectedSpecialty = computed<LookupItem | null>(() =>
      specialtyTypes.value.find(s => s.id === form.value.specialtyTypeId) ?? null
    );

    watch(() => form.value.specialtyTypeId, () => {
      if (form.value.therapistId > 0 && !filteredTherapists.value.some(t => t.therapistId === form.value.therapistId)) {
        form.value.therapistId = 0;
      }
      // WP-40: the on-site choice only survives while the specialty offers it.
      if (!selectedSpecialty.value?.offeredOnSite) {
        onSiteVisit.value = false;
        onSiteSiteId.value = 0;
      }
    });

    // WP-37 (SEN-1/G2): SENADIS applies only while active for the SESSION DATE being booked —
    // no expiry (null) = always active; boundary (session date == expiry) still applies;
    // expired ⇒ no discount and the badge explains why. The flag is never auto-cleared (G3).
    const senadisActive = computed(
      () => senadisPatient.value && !isSenadisExpired(senadisExpiry.value, form.value.sessionDate)
    );
    const senadisExpired = computed(
      () => senadisPatient.value && isSenadisExpired(senadisExpiry.value, form.value.sessionDate)
    );

    // WP-40 (BK-2): client-side mirror of the WP-39 price resolution — duration row →
    // defaultAmount → none. UX preview only; the API re-derives authoritatively at the
    // session date (the lookup projection is current-effective as of today).
    const priceRow = computed(() =>
      (selectedSpecialty.value?.durationPrices ?? []).find(p => p.durationMinutes === form.value.duration) ?? null
    );
    const amountSource = computed<'durationPrice' | 'defaultAmount' | 'none'>(() => {
      if (!selectedSpecialty.value) return 'none';
      if (priceRow.value) return 'durationPrice';
      if (selectedSpecialty.value.defaultAmount != null) return 'defaultAmount';
      return 'none';
    });
    const derivedAmount = computed<number | null>(() =>
      priceRow.value?.amount ?? selectedSpecialty.value?.defaultAmount ?? null
    );
    // G4: a selected specialty with no resolvable price blocks the booking.
    const missingPrice = computed(() =>
      form.value.specialtyTypeId > 0 && amountSource.value === 'none'
    );

    // G2 ruling: derived discount — exactly 20% when SENADIS is active, else exactly 0.
    const derivedDiscount = computed(() =>
      senadisActive.value && derivedAmount.value != null
        ? Math.round(0.20 * derivedAmount.value * 100) / 100
        : 0
    );

    // Fee preview from the selected therapist's model (flat when pct = 0, else % of net).
    // Display-gated behind Appointments.ProviderAmount; the API recomputes regardless.
    const derivedProviderAmount = computed(() => {
      const t = therapists.value.find(x => x.therapistId === form.value.therapistId);
      if (!t || derivedAmount.value == null) return 0;
      const net = derivedAmount.value - derivedDiscount.value;
      const fee = t.feePctPerSession === 0 ? t.feePerSession : net * t.feePctPerSession;
      return Math.round(fee * 100) / 100;
    });

    const onSiteTripCharge = computed(() =>
      sites.value.find(s => s.siteId === onSiteSiteId.value)?.onSiteTripChargeAmount ?? 0
    );

    // Lazy: sites are only needed once the (dormant) on-site checkbox is first used.
    watch(onSiteVisit, async (checked) => {
      if (checked && sites.value.length === 0) {
        try {
          sites.value = await sitesClient.getSites();
        } catch {
          // Non-fatal — the select stays empty and submit stays blocked
        }
      }
    });

    // WP-23 (F10): the caretaker check is now a hard block (was a soft warning) — the API
    // enforces the same rule with a 400, this keeps the modal honest before submit.
    // WP-40: missing price (G4) also blocks; an on-site visit needs a site.
    const isValid = computed(() => {
      return form.value.patientId > 0 && form.value.therapistId > 0 && form.value.specialtyTypeId > 0
        && !caretakerWarning.value
        && !missingPrice.value
        && (!onSiteVisit.value || onSiteSiteId.value > 0);
    });

    const loadDropdowns = async () => {
      try {
        const [t, s] = await Promise.all([
          therapistsClient.getTherapists(),
          lookupClient.getAll('specialty-types'),
        ]);
        therapists.value = t.sort((a, b) => a.therapistName.localeCompare(b.therapistName));
        specialtyTypes.value = s.sort((a, b) => a.sortOrder - b.sortOrder || a.abbreviation.localeCompare(b.abbreviation));
      } catch {
        // Silently fail — dropdowns will be empty
      }
    };

    // WP-30: server-backed patient typeahead (name/MRN/cedula, capped at 20 server-side).
    const fetchPatientOptions = async (q: string): Promise<LookupOption[]> =>
      (await patientsClient.lookupPatients(q)).map((p) => ({
        id: p.patientId,
        name: p.patientName,
        detail: p.medicalRecordNumber ? `MRN ${p.medicalRecordNumber}` : null,
      }));

    // Selection drives the form id; clearing the picker resets it.
    watch(selectedPatient, (sel) => {
      form.value.patientId = sel?.id ?? 0;
    });

    // A pre-selected patient (booked from another view) arrives as a bare id — fetch the
    // profile so the typeahead can show who is selected.
    const loadPreselectedPatient = async (patientId: number) => {
      try {
        const p = await patientsClient.getPatient(patientId);
        selectedPatient.value = {
          id: p.patientId,
          name: p.patientName,
          detail: p.medicalRecordNumber ? `MRN ${p.medicalRecordNumber}` : null,
        };
      } catch {
        // Silently fail — the user can search manually
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
      if (patientId <= 0) { needsDiscovery.value = false; senadisPatient.value = false; senadisExpiry.value = null; return; }
      try {
        const patient = await patientsClient.getPatient(patientId);
        // WP-24 (F3/F4): requiresDiscovery=false waives the discovery-first rule (legacy
        // imports); !== false tolerates an older API that omits the field (⇒ still required).
        needsDiscovery.value = patient.requiresDiscovery !== false && patient.hasCompletedDiscovery === false;
        // WP-23 (F7): same fetched profile carries the SENADIS flag — one toast per
        // patient selection, then clamp the discount up to the floor.
        // WP-37: also carries the expiry; toast + clamp only when active for the session date
        // (a flagged-but-expired patient gets the badge instead — no floor).
        senadisPatient.value = patient.hasSenadisDiscount === true;
        senadisExpiry.value = patient.senadisExpirationDate ?? null;
        // WP-40: no toast/clamp — the discount is a derived read-only display and the
        // "SENADIS 20% applied" badge explains it in place.
      } catch {
        needsDiscovery.value = false; // Fail open — don't block booking
        senadisPatient.value = false; // (the API derives server-side regardless)
        senadisExpiry.value = null;
      }
    };

    watch(() => form.value.patientId, (id) => { checkCaretaker(id); checkDiscovery(id); });
    watch(form, () => { saveError.value = ''; }, { deep: true });

    watch(() => props.visible, (val) => {
      if (val) {
        loadDropdowns();
        saveError.value = '';
        needsDiscovery.value = false;
        senadisPatient.value = false;
        senadisExpiry.value = null;
        selectedPatient.value = null;
        if (props.preSelectPatientId > 0) {
          loadPreselectedPatient(props.preSelectPatientId);
        }
        onSiteVisit.value = false;
        onSiteSiteId.value = 0;
        form.value = {
          patientId: props.preSelectPatientId || 0,
          therapistId: 0,
          sessionDate: props.isWalkIn ? today : today,
          sessionTime: props.isWalkIn ? nowTime : '09:00',
          specialtyTypeId: 0,
          duration: 60,
          notes: props.isWalkIn ? 'Walk-in patient' : '',
        };
      }
    });

    const handleSubmit = async () => {
      saving.value = true;
      saveError.value = '';
      try {
        // WP-40: the money values sent are the derived preview — the API ignores them and
        // re-derives from the price sheet + SENADIS rule + fee model (contract note).
        const request: SessionEventRequest = {
          sessionDate: form.value.sessionDate,
          sessionTime: form.value.sessionTime + ':00',
          patientId: form.value.patientId,
          therapistId: form.value.therapistId,
          therapyType: 'N/A', // backward compat — API resolves from specialtyTypeId
          duration: form.value.duration,
          amount: derivedAmount.value ?? 0,
          discount: derivedDiscount.value,
          providerAmount: derivedProviderAmount.value,
          isPaidOff: false,
          notes: form.value.notes,
          appointmentStatusId: props.isWalkIn ? 6 : 1, // CheckedIn for walk-in, Proposed for booking
          specialtyTypeId: form.value.specialtyTypeId,
          isOnSiteVisit: onSiteVisit.value,
          siteId: onSiteVisit.value ? onSiteSiteId.value : undefined,
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

    return { form, selectedPatient, fetchPatientOptions, filteredTherapists, filteredSpecialties, saving, saveError, caretakerWarning, needsDiscovery, senadisPatient, senadisExpiry, senadisActive, senadisExpired, formatSenadisExpiry, isValid, handleSubmit, timeMin: TIME_MIN, timeMax: TIME_MAX, timeStep: TIME_STEP, hasClaim, Permissions, bookableDurations: BOOKABLE_DURATIONS, selectedSpecialty, derivedAmount, derivedDiscount, derivedProviderAmount, amountSource, missingPrice, onSiteVisit, onSiteSiteId, sites, onSiteTripCharge };
  },
});
</script>
