<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <div class="px-6 py-4 border-b border-slate-200">
      <h2 class="text-lg font-semibold text-slate-800">Merge Duplicate Patients</h2>
      <p class="text-sm text-slate-500 mt-0.5">
        Move everything from a duplicate record onto the record you keep, then permanently
        delete the duplicate. SYSADMIN only — this cannot be undone from the app.
      </p>
    </div>

    <div class="p-6 space-y-6">
      <!-- Error banner -->
      <div v-if="error" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <!-- Result card (terminal step) -->
      <div v-if="result" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-sm font-semibold text-emerald-800">
          ✓ Merge completed — log #{{ result.mergeLogId }}
        </p>
        <ul class="mt-2 text-sm text-emerald-900 space-y-0.5">
          <li>{{ result.counts.sessionsRemapped }} session(s) moved to the surviving record</li>
          <li>{{ result.counts.plansRemapped }} treatment plan(s) moved</li>
          <li>
            Caretaker links: {{ result.counts.caretakerLinksRemapped }} moved,
            {{ result.counts.caretakerLinksDeduped }} duplicate(s) removed,
            {{ result.counts.syntheticCaretakersDeleted }} placeholder(s) retired
          </li>
          <li v-if="result.fieldsFilled.length > 0">
            Fields inherited by the survivor: {{ result.fieldsFilled.join(', ') }}
          </li>
        </ul>
        <button
          type="button"
          class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          @click="reset"
        >
          Merge another pair
        </button>
      </div>

      <template v-else>
        <!-- Step 1: pick the pair -->
        <div class="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-start gap-4">
          <PatientSearchSelect
            v-model="survivor"
            label="Survivor (record to KEEP)"
            accent="keep"
            :patients="patients"
            :exclude-id="eliminated?.patientId ?? null"
          />
          <button
            type="button"
            class="mt-6 self-center rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            title="Swap survivor and duplicate"
            :disabled="!survivor && !eliminated"
            @click="swap"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <PatientSearchSelect
            v-model="eliminated"
            label="Duplicate (record to DELETE)"
            accent="remove"
            :patients="patients"
            :exclude-id="survivor?.patientId ?? null"
          />
        </div>

        <div v-if="loadingPatients" class="text-sm text-slate-400">Loading patients…</div>

        <div>
          <button
            type="button"
            class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!canPreview || previewing"
            @click="runPreview"
          >
            {{ previewing ? 'Analyzing…' : 'Preview merge' }}
          </button>
        </div>

        <!-- Step 2: preview -->
        <div v-if="preview" class="space-y-4" data-testid="merge-preview">
          <!-- Blockers -->
          <div
            v-if="preview.blockers.length > 0"
            class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
            data-testid="merge-blockers"
          >
            <p class="text-sm font-semibold text-rose-800">This pair cannot be merged:</p>
            <ul class="mt-1 list-disc pl-5 text-sm text-rose-700">
              <li v-for="(b, i) in preview.blockers" :key="i">{{ b }}</li>
            </ul>
          </div>

          <!-- Warnings -->
          <div
            v-if="preview.warnings.length > 0"
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <ul class="list-disc pl-5 text-sm text-amber-800">
              <li v-for="(w, i) in preview.warnings" :key="i">{{ w }}</li>
            </ul>
          </div>

          <!-- Identity cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="side in identitySides"
              :key="side.key"
              class="rounded-lg border p-4"
              :class="side.key === 'survivor' ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'"
            >
              <p class="text-xs font-semibold uppercase tracking-wider"
                 :class="side.key === 'survivor' ? 'text-emerald-700' : 'text-rose-700'">
                {{ side.title }}
              </p>
              <p class="mt-1 text-sm font-semibold text-slate-800">{{ side.who.patientName }}</p>
              <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                <dt>MRN</dt><dd class="text-right">{{ side.who.medicalRecordNumber ?? '—' }}</dd>
                <dt>Cedula</dt><dd class="text-right">{{ side.who.cedula ?? '—' }}</dd>
                <dt>Date of birth</dt><dd class="text-right">{{ formatDate(side.who.dateOfBirth) }}</dd>
                <dt>Gender</dt><dd class="text-right">{{ side.who.gender ?? '—' }}</dd>
                <dt>Status</dt><dd class="text-right">{{ side.who.isActive ? 'Active' : 'Inactive' }}</dd>
                <dt>Sessions</dt><dd class="text-right font-medium">{{ side.who.sessionCount }}</dd>
                <dt>Treatment plans</dt><dd class="text-right font-medium">{{ side.who.planCount }}</dd>
                <dt>Caretakers</dt><dd class="text-right font-medium">{{ side.who.caretakerCount }}</dd>
              </dl>
            </div>
          </div>

          <!-- What will happen -->
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">What this merge will do</p>
            <ul class="mt-2 text-sm text-slate-700 space-y-1">
              <li>Move <strong>{{ preview.counts.sessionsToRemap }}</strong> session(s) and <strong>{{ preview.counts.plansToRemap }}</strong> treatment plan(s) to {{ preview.survivor.patientName }}</li>
              <li v-for="c in preview.caretakers" :key="c.caretakerId">
                Caretaker "{{ c.caretakerName }}"<span v-if="c.isSynthetic"> (placeholder)</span> —
                <span v-if="c.disposition === 'remap'">moved to the survivor<span v-if="c.primaryFlagDropped"> (as non-primary)</span></span>
                <span v-else-if="c.disposition === 'dedupe-delete'">already linked to the survivor; duplicate link removed</span>
                <span v-else>placeholder retired (deleted)</span>
              </li>
              <li v-for="f in preview.fieldFills" :key="f.field">
                Survivor inherits <strong>{{ f.field }}</strong>: {{ f.value }}
              </li>
              <li class="text-rose-700">
                Then <strong>permanently delete</strong> {{ preview.eliminated.patientName }}
                (#{{ preview.eliminated.patientId }}) and its login identity.
                An audit record is kept.
              </li>
            </ul>
          </div>

          <!-- Step 3: type-to-confirm -->
          <div v-if="preview.blockers.length === 0" class="rounded-lg border border-slate-200 p-4">
            <label class="block text-sm text-slate-700">
              To confirm, type the duplicate's
              <template v-if="confirmTarget.kind === 'mrn'">MRN <strong>{{ confirmTarget.value }}</strong></template>
              <template v-else>full name <strong>{{ confirmTarget.value }}</strong></template>
            </label>
            <input
              v-model="confirmText"
              type="text"
              class="mt-2 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              :placeholder="confirmTarget.value"
              data-testid="merge-confirm-input"
            />
            <button
              type="button"
              class="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!confirmMatches || merging"
              data-testid="merge-execute-button"
              @click="runMerge"
            >
              {{ merging ? 'Merging…' : 'Merge & Delete duplicate' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import PatientSearchSelect from '../patients/PatientSearchSelect.vue';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import type { Patient } from '../../interfaces/Patient';
import type { PatientMergePreview, PatientMergeResult } from '../../interfaces/PatientMerge';

/**
 * WP-22 (F2): Admin › Merge Patients — SYSADMIN-only stepper:
 * pick survivor + duplicate → preview (blockers disable execute) → type-to-confirm → result.
 */
export default defineComponent({
  name: 'PatientMergePanel',
  components: { PatientSearchSelect },
  setup() {
    const client = new PatientsHttpClient();

    const patients = ref<Patient[]>([]);
    const loadingPatients = ref(false);
    const survivor = ref<Patient | null>(null);
    const eliminated = ref<Patient | null>(null);
    const preview = ref<PatientMergePreview | null>(null);
    const result = ref<PatientMergeResult | null>(null);
    const confirmText = ref('');
    const previewing = ref(false);
    const merging = ref(false);
    const error = ref('');

    const loadPatients = async () => {
      loadingPatients.value = true;
      try {
        patients.value = await client.getPatients();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load patients.';
      } finally {
        loadingPatients.value = false;
      }
    };
    onMounted(loadPatients);

    const canPreview = computed(
      () => !!survivor.value && !!eliminated.value
        && survivor.value.patientId !== eliminated.value.patientId,
    );

    // Confirmation target: the duplicate's MRN, falling back to its exact name when the
    // MRN is missing/temporary (TEMP- MRNs are machine-generated and unfamiliar to users).
    const confirmTarget = computed<{ kind: 'mrn' | 'name'; value: string }>(() => {
      const who = preview.value?.eliminated;
      const mrn = who?.medicalRecordNumber ?? '';
      if (mrn && !mrn.toUpperCase().startsWith('TEMP-')) return { kind: 'mrn', value: mrn };
      return { kind: 'name', value: who?.patientName ?? '' };
    });

    const confirmMatches = computed(
      () => confirmText.value.trim() === confirmTarget.value.value && confirmTarget.value.value !== '',
    );

    const identitySides = computed(() => preview.value
      ? [
          { key: 'survivor', title: 'Keep — Survivor', who: preview.value.survivor },
          { key: 'eliminated', title: 'Delete — Duplicate', who: preview.value.eliminated },
        ]
      : []);

    const swap = () => {
      const s = survivor.value;
      survivor.value = eliminated.value;
      eliminated.value = s;
      preview.value = null;
      confirmText.value = '';
    };

    const runPreview = async () => {
      if (!survivor.value || !eliminated.value) return;
      previewing.value = true;
      error.value = '';
      preview.value = null;
      confirmText.value = '';
      try {
        preview.value = await client.previewMerge({
          survivorPatientId: survivor.value.patientId,
          eliminatedPatientId: eliminated.value.patientId,
        });
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to preview the merge.';
      } finally {
        previewing.value = false;
      }
    };

    const runMerge = async () => {
      if (!survivor.value || !eliminated.value || !confirmMatches.value) return;
      merging.value = true;
      error.value = '';
      try {
        result.value = await client.executeMerge({
          survivorPatientId: survivor.value.patientId,
          eliminatedPatientId: eliminated.value.patientId,
        });
        // The census changed (one record gone, survivor possibly enriched) — reload.
        await loadPatients();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'The merge failed — nothing was changed.';
      } finally {
        merging.value = false;
      }
    };

    const reset = () => {
      survivor.value = null;
      eliminated.value = null;
      preview.value = null;
      result.value = null;
      confirmText.value = '';
      error.value = '';
    };

    const formatDate = (iso: string | null) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
    };

    return {
      patients, loadingPatients, survivor, eliminated, preview, result,
      confirmText, confirmTarget, confirmMatches, previewing, merging, error,
      canPreview, identitySides, swap, runPreview, runMerge, reset, formatDate,
    };
  },
});
</script>
