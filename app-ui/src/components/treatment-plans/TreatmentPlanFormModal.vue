<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
      <div class="relative w-full max-w-2xl bg-white shadow-xl flex flex-col h-full">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <h2 class="text-lg font-semibold text-slate-800">
              {{ isEditing ? 'Edit Treatment Plan' : 'Create Treatment Plan' }}
            </h2>
            <span
              v-if="isEditing && plan"
              :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', planStatusBadgeClass(plan.planStatus)]"
            >
              {{ plan.planStatus }}
            </span>
          </div>
          <button @click="$emit('close')" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <!-- Section 1: Discovery Session -->
          <div class="bg-slate-50 rounded-lg p-4">
            <label class="text-sm font-semibold text-slate-700 mb-3 block">Discovery Session</label>
            <div v-if="isEditing && plan">
              <p class="text-sm text-slate-600">
                Discovery Session #{{ plan.discoverySessionId }}
                &mdash; {{ plan.discoverySpecialty }}, {{ formatDate(plan.discoveryDate) }}
              </p>
            </div>
            <div v-else>
              <label class="block text-sm font-medium text-slate-700 mb-1">Discovery Session</label>
              <div v-if="discoverySessionsLoading" class="text-sm text-slate-400">Loading discovery sessions...</div>
              <div v-else-if="discoverySessions.length === 0" class="text-sm text-amber-600">
                No completed discovery sessions found for this patient.
              </div>
              <select
                v-else
                v-model.number="form.discoverySessionId"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option :value="0" disabled>Select a discovery session...</option>
                <option v-for="ds in discoverySessions" :key="ds.sessionId" :value="ds.sessionId">
                  #{{ ds.sessionId }} &mdash; {{ ds.specialtyAbbreviation }} on {{ formatDate(ds.sessionDate) }} with {{ ds.therapistName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Section 2: Plan Details -->
          <div>
            <label class="text-sm font-semibold text-slate-700 mb-3 block">Plan Details</label>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Results Document URL</label>
                <input
                  v-model="form.resultsDocumentUrl"
                  type="text"
                  placeholder="https://drive.google.com/..."
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Sessions per Week</label>
                  <input
                    v-model.number="form.weeklyFrequency"
                    type="number"
                    min="1"
                    max="5"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Duration Weeks</label>
                  <input
                    v-model.number="form.durationWeeks"
                    type="number"
                    min="1"
                    max="52"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Optional notes..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Section 3: Treatment Lines -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <label class="text-sm font-semibold text-slate-700">Treatment Lines</label>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {{ lines.length }}
                </span>
              </div>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                @click="addLine"
              >
                + Add Line
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(line, index) in lines"
                :key="index"
                class="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
              >
                <!-- Line header -->
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-500 uppercase">Line {{ index + 1 }}</span>
                  <button
                    v-if="lines.length > 1"
                    type="button"
                    class="text-red-500 hover:text-red-700 text-xs font-medium"
                    @click="removeLine(index)"
                  >
                    Remove
                  </button>
                </div>

                <!-- Row 1: Specialty + Therapist -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                    <select
                      v-model="line.specialtyTypeId"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option :value="0" disabled>Select specialty...</option>
                      <option v-for="s in treatmentSpecialties" :key="s.id" :value="s.id">
                        {{ s.abbreviation }} &mdash; {{ s.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Therapist</label>
                    <select
                      v-model="line.preferredTherapistId"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option :value="null">Any Qualified Therapist</option>
                      <option v-for="t in therapistsForLine(line)" :key="t.therapistId" :value="t.therapistId">
                        {{ t.therapistName }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Row 2: Day + Time + Duration -->
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                    <select
                      v-model="line.dayOfWeek"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option :value="null">Flexible</option>
                      <option v-for="(label, key) in DAY_OF_WEEK_LABELS" :key="key" :value="Number(key)">
                        {{ label }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
                    <input
                      v-model="line.preferredTime"
                      type="time"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                    <input
                      v-model.number="line.duration"
                      type="number"
                      min="15"
                      step="15"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <div v-if="lineCountMismatch" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-sm text-amber-700">
              Line count ({{ lines.length }}) does not match sessions per week ({{ form.weeklyFrequency }}).
              Plan will stay in Draft until this is resolved.
            </p>
          </div>
          <div v-if="saveError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">{{ saveError }}</p>
          </div>
          <div class="flex items-center justify-end space-x-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="isEditing && plan && plan.planStatus === 'Draft'"
              @click="handleActivate"
              :disabled="saving || lineCountMismatch"
              :title="lineCountMismatch ? 'Line count must match sessions per week before activating' : ''"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                saving || lineCountMismatch
                  ? 'bg-emerald-300 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              ]"
            >
              {{ saving ? 'Saving...' : 'Activate' }}
            </button>
            <button
              v-if="!isEditing || (plan && plan.planStatus === 'Draft')"
              @click="handleSave"
              :disabled="saving"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                saving
                  ? 'bg-violet-300 text-white cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700',
              ]"
            >
              {{ saving ? 'Saving...' : 'Save as Draft' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import { TreatmentPlansHttpClient } from '../../services/TreatmentPlansHttpClient';
import { LookupHttpClient } from '../../services/LookupHttpClient';
import { TherapistsHttpClient } from '../../services/TherapistsHttpClient';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import type { TreatmentPlan, TreatmentPlanRequest, TreatmentPlanLineRequest, DiscoverySessionSummary } from '../../interfaces/TreatmentPlan';
import { DAY_OF_WEEK_LABELS, isDiscoverySpecialty, planStatusBadgeClass } from '../../interfaces/TreatmentPlan';
import type { LookupItem } from '../../interfaces/Lookups';
import type { Therapist } from '../../interfaces/Therapist';

interface FormLine {
  specialtyTypeId: number;
  preferredTherapistId: number | null;
  dayOfWeek: number | null;
  preferredTime: string;
  duration: number;
}

export default defineComponent({
  name: 'TreatmentPlanFormModal',
  props: {
    visible: { type: Boolean, required: true },
    plan: { type: Object as PropType<TreatmentPlan | null>, default: null },
    patientId: { type: Number, required: true },
    patientName: { type: String, default: '' },
    discoverySessionId: { type: Number, default: 0 },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const plansClient = new TreatmentPlansHttpClient();
    const lookupClient = new LookupHttpClient();
    const therapistsClient = new TherapistsHttpClient();
    const sessionsClient = new SessionsHttpClient();

    const specialtyTypes = ref<LookupItem[]>([]);
    const therapists = ref<Therapist[]>([]);
    const discoverySessions = ref<DiscoverySessionSummary[]>([]);
    const discoverySessionsLoading = ref(false);
    const saving = ref(false);
    const saveError = ref('');

    const isEditing = ref(false);

    const form = ref({
      discoverySessionId: 0,
      resultsDocumentUrl: '',
      weeklyFrequency: 2,
      durationWeeks: 8,
      notes: '',
    });

    const lines = ref<FormLine[]>([]);

    const treatmentSpecialties = ref<LookupItem[]>([]);

    const lineCountMismatch = computed(() => {
      return lines.value.length !== form.value.weeklyFrequency;
    });

    const loadDiscoverySessions = async () => {
      if (props.patientId <= 0) return;
      discoverySessionsLoading.value = true;
      try {
        discoverySessions.value = await sessionsClient.getDiscoverySessions(props.patientId);
        // Auto-select if exactly one discovery session and none is pre-selected
        if (discoverySessions.value.length === 1 && form.value.discoverySessionId === 0) {
          form.value.discoverySessionId = discoverySessions.value[0].sessionId;
        }
      } catch {
        discoverySessions.value = [];
      } finally {
        discoverySessionsLoading.value = false;
      }
    };

    const emptyLine = (): FormLine => ({
      specialtyTypeId: 0,
      preferredTherapistId: null,
      dayOfWeek: null,
      preferredTime: '',
      duration: 60,
    });

    const therapistsForLine = (line: FormLine): Therapist[] => {
      if (line.specialtyTypeId <= 0) return therapists.value;
      return therapists.value.filter(t =>
        t.specialties.some(s => s.specialtyId === line.specialtyTypeId)
      );
    };

    const loadDropdowns = async () => {
      try {
        const [allSpecialties, allTherapists] = await Promise.all([
          lookupClient.getAll('specialty-types'),
          therapistsClient.getTherapists(),
        ]);
        specialtyTypes.value = allSpecialties.sort((a, b) => a.sortOrder - b.sortOrder || a.abbreviation.localeCompare(b.abbreviation));
        // Filter out discovery specialties for treatment lines
        treatmentSpecialties.value = specialtyTypes.value.filter(s => !isDiscoverySpecialty(s.abbreviation));
        therapists.value = allTherapists.sort((a, b) => a.therapistName.localeCompare(b.therapistName));
      } catch {
        // Dropdowns will be empty
      }
    };

    const resetForm = () => {
      form.value = {
        discoverySessionId: props.discoverySessionId || 0,
        resultsDocumentUrl: '',
        weeklyFrequency: 2,
        durationWeeks: 8,
        notes: '',
      };
      lines.value = [emptyLine()];
      saveError.value = '';
    };

    const populateFromPlan = (p: TreatmentPlan) => {
      form.value = {
        discoverySessionId: p.discoverySessionId,
        resultsDocumentUrl: p.resultsDocumentUrl || '',
        weeklyFrequency: p.weeklyFrequency,
        durationWeeks: p.durationWeeks,
        notes: p.notes || '',
      };
      lines.value = p.lines.map(l => ({
        specialtyTypeId: l.specialtyTypeId,
        preferredTherapistId: l.preferredTherapistId,
        dayOfWeek: l.dayOfWeek,
        preferredTime: l.preferredTime || '',
        duration: l.duration,
      }));
      if (lines.value.length === 0) {
        lines.value = [emptyLine()];
      }
    };

    watch(() => props.visible, (val) => {
      if (val) {
        loadDropdowns();
        isEditing.value = !!props.plan;
        if (props.plan) {
          populateFromPlan(props.plan);
        } else {
          resetForm();
          loadDiscoverySessions();
        }
      }
    });

    // Clear error on form change
    watch(form, () => { saveError.value = ''; }, { deep: true });
    watch(lines, () => { saveError.value = ''; }, { deep: true });

    const buildRequest = (): TreatmentPlanRequest => {
      const lineRequests: TreatmentPlanLineRequest[] = lines.value.map((l, i) => ({
        specialtyTypeId: l.specialtyTypeId,
        preferredTherapistId: l.preferredTherapistId,
        dayOfWeek: l.dayOfWeek,
        preferredTime: l.preferredTime ? (l.preferredTime.length === 5 ? l.preferredTime + ':00' : l.preferredTime) : null,
        duration: l.duration,
        sortOrder: i + 1,
      }));

      return {
        patientId: props.patientId,
        discoverySessionId: form.value.discoverySessionId,
        createdByTherapistId: props.plan?.createdByTherapistId || 1,
        resultsDocumentUrl: form.value.resultsDocumentUrl || null,
        weeklyFrequency: form.value.weeklyFrequency,
        durationWeeks: form.value.durationWeeks,
        notes: form.value.notes || null,
        lines: lineRequests,
      };
    };

    const handleSave = async () => {
      saving.value = true;
      saveError.value = '';
      try {
        const request = buildRequest();
        if (isEditing.value && props.plan) {
          await plansClient.update(props.plan.id, request);
        } else {
          await plansClient.create(request);
        }
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Failed to save treatment plan.';
      } finally {
        saving.value = false;
      }
    };

    const handleActivate = async () => {
      if (!props.plan) return;
      saving.value = true;
      saveError.value = '';
      try {
        await plansClient.activate(props.plan.id);
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Failed to activate treatment plan.';
      } finally {
        saving.value = false;
      }
    };

    const addLine = () => {
      lines.value.push(emptyLine());
    };

    const removeLine = (index: number) => {
      if (lines.value.length > 1) {
        lines.value.splice(index, 1);
      }
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return {
      form,
      lines,
      isEditing,
      saving,
      saveError,
      discoverySessions,
      discoverySessionsLoading,
      lineCountMismatch,
      treatmentSpecialties,
      therapistsForLine,
      DAY_OF_WEEK_LABELS,
      planStatusBadgeClass,
      handleSave,
      handleActivate,
      addLine,
      removeLine,
      formatDate,
    };
  },
});
</script>
