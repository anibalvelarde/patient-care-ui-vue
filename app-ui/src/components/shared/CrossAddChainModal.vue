<template>
  <div>
    <teleport to="body">
      <!-- Chooser: offered right after the origin record is created (Option A hand-off) -->
      <div v-if="visible && step === 'chooser'" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="dismiss"></div>
        <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6" data-testid="chain-chooser">
          <div class="flex items-start space-x-3">
            <span class="mt-0.5 w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-sm shrink-0">✓</span>
            <p class="text-sm font-semibold text-slate-800">
              {{ addingCaretaker ? 'Patient created' : 'Caretaker created' }} — {{ target?.name }}
            </p>
          </div>
          <div
            v-if="addingCaretaker"
            class="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800"
          >
            This patient has no caretaker on file — <strong>bookings are blocked until one is linked</strong>.
          </div>
          <div v-else class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-800">
            No patients linked yet — link the patient this caretaker is responsible for, or create one now.
          </div>
          <div class="mt-4 space-y-2">
            <button
              v-if="canLink"
              data-testid="chain-link-existing"
              class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 text-left transition-colors"
              @click="openLink"
            >
              Link an existing {{ otherNoun }}
            </button>
            <button
              v-if="canCreate"
              data-testid="chain-create-new"
              class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-left transition-colors"
              @click="step = 'create'"
            >
              Create a new {{ otherNoun }}
            </button>
            <button
              data-testid="chain-later"
              class="w-full px-4 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition-colors"
              @click="dismiss"
            >
              Later{{ addingCaretaker ? " — I'll link one from the patient's page" : '' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Link existing: its own slide-over with the context banner -->
      <div v-if="visible && step === 'link'" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="step = 'chooser'"></div>
        <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200">
            <h2 class="text-lg font-semibold text-slate-800">Link {{ otherLabel }}</h2>
          </div>
          <div class="px-6 pt-4">
            <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800" data-testid="chain-link-banner">
              <template v-if="addingCaretaker">Linking to patient <strong>{{ target?.name }}</strong></template>
              <template v-else>Linking caretaker <strong>{{ target?.name }}</strong> to a patient</template>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <CaretakerLinkForm
              :entity-label="otherLabel"
              :options="options"
              :saving="saving"
              @submit="doLink"
              @cancel="step = 'chooser'"
            />
            <p v-if="errorMsg" class="text-sm text-red-600 mt-3" data-testid="chain-error">{{ errorMsg }}</p>
          </div>
        </div>
      </div>

      <!-- Success -->
      <div v-if="visible && step === 'success'" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="finish"></div>
        <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 text-center" data-testid="chain-success">
          <p class="text-sm font-semibold text-green-700">✓ {{ successMsg }}</p>
          <p v-if="addingCaretaker" class="text-xs text-slate-500 mt-1">{{ target?.name }} is now bookable.</p>
          <button
            class="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            @click="finish"
          >
            Close
          </button>
        </div>
      </div>

      <!-- Created but the link call failed: keep the chain open with a retry (non-atomic by design) -->
      <div v-if="visible && step === 'link-failed'" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6" data-testid="chain-link-failed">
          <p class="text-sm font-semibold text-amber-700">
            {{ otherLabel }} <strong>{{ createdName }}</strong> was created, but linking failed.
          </p>
          <p class="text-xs text-red-600 mt-2">{{ errorMsg }}</p>
          <div class="mt-4 flex items-center space-x-2">
            <button
              data-testid="chain-retry-link"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              :disabled="saving"
              @click="doPendingLink"
            >
              Retry link
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              @click="finish"
            >
              Link manually later
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Create new: reuse the real form modals so WP-24/25 behavior rides along; they teleport themselves -->
    <CaretakerFormModal
      v-if="addingCaretaker"
      :visible="visible && step === 'create'"
      :caretaker="null"
      :link-to="linkToCtx"
      @created="onCreated"
      @close="onCreateClosed"
    />
    <PatientFormModal
      v-else
      :visible="visible && step === 'create'"
      :patient="null"
      :link-to="linkToCtx"
      @created="onCreated"
      @close="onCreateClosed"
    />
  </div>
</template>

<script lang="ts">
// WP-27 (F8/F9) — Option A sequential hand-off chain (owner ruling 2026-07-13, both directions).
// Opened by PatientsView (mode=add-caretaker, F8) / CaretakersView (mode=add-patient, F9) right
// after a create. All affordances gate on the claims the API actually enforces: linking is
// caretaker-side ONLY (POST /api/caretakers/{id}/patients ⇒ Caretakers.LinkPatient), create-new
// additionally needs Caretakers.Edit / Patients.Edit.
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import CaretakerLinkForm, { type LinkOption } from './CaretakerLinkForm.vue';
import CaretakerFormModal from '../caretakers/CaretakerFormModal.vue';
import PatientFormModal from '../patients/PatientFormModal.vue';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { useClaims, Permissions } from '../../composables/useClaims';
import type { Caretaker } from '../../interfaces/Caretaker';
import type { Patient } from '../../interfaces/Patient';
import type { CreatedForChain } from '../../interfaces/CrossAdd';

type ChainStep = 'chooser' | 'link' | 'create' | 'success' | 'link-failed';

export interface ChainTarget {
  id: number;
  name: string;
}

export default defineComponent({
  name: 'CrossAddChainModal',
  components: { CaretakerLinkForm, CaretakerFormModal, PatientFormModal },
  props: {
    visible: { type: Boolean, required: true },
    // 'add-caretaker' = F8 (a patient was just created); 'add-patient' = F9 (a caretaker was)
    mode: { type: String as PropType<'add-caretaker' | 'add-patient'>, required: true },
    target: { type: Object as PropType<ChainTarget | null>, default: null },
  },
  emits: ['close', 'linked'],
  setup(props, { emit }) {
    const { hasClaim } = useClaims();
    const caretakerClient = new CaretakersHttpClient();
    const patientClient = new PatientsHttpClient();

    const step = ref<ChainStep>('chooser');
    const options = ref<LinkOption[]>([]);
    const saving = ref(false);
    const errorMsg = ref('');
    const successMsg = ref('');
    const createdName = ref('');
    const pendingLink = ref<{ id: number; relationship: string | null; isPrimary: boolean } | null>(null);

    const addingCaretaker = computed(() => props.mode === 'add-caretaker');
    const otherNoun = computed(() => (addingCaretaker.value ? 'caretaker' : 'patient'));
    const otherLabel = computed(() => (addingCaretaker.value ? 'Caretaker' : 'Patient'));

    const canLink = computed(() => hasClaim('Permission', Permissions.CaretakersLinkPatient));
    const canCreate = computed(
      () =>
        canLink.value &&
        hasClaim('Permission', addingCaretaker.value ? Permissions.CaretakersEdit : Permissions.PatientsEdit)
    );

    const linkToCtx = computed(() => (props.target ? { name: props.target.name } : null));

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        step.value = 'chooser';
        options.value = [];
        errorMsg.value = '';
        successMsg.value = '';
        createdName.value = '';
        pendingLink.value = null;
      }
    );

    const openLink = async () => {
      step.value = 'link';
      errorMsg.value = '';
      try {
        options.value = addingCaretaker.value
          ? (await caretakerClient.getCaretakers()).map((c) => ({ id: c.caretakerId, name: c.caretakerName }))
          : (await patientClient.getPatients()).map((p) => ({ id: p.patientId, name: p.patientName }));
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to load data.';
      }
    };

    const link = async (otherId: number, isPrimary: boolean, relationship: string | null) => {
      if (!props.target) return;
      // Both directions call the caretaker-side endpoint — orient the ids by mode.
      const caretakerId = addingCaretaker.value ? otherId : props.target.id;
      const patientId = addingCaretaker.value ? props.target.id : otherId;
      await caretakerClient.linkPatient(caretakerId, patientId, isPrimary, relationship);
    };

    const doLink = async (payload: { id: number; relationship: string | null; isPrimary: boolean }) => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await link(payload.id, payload.isPrimary, payload.relationship);
        const name = options.value.find((o) => o.id === payload.id)?.name ?? otherLabel.value;
        successMsg.value = `${name} linked${payload.isPrimary ? ' as primary' : ''}`;
        step.value = 'success';
        emit('linked');
      } catch (e: unknown) {
        // Stay on the link step — the form itself is the retry affordance.
        errorMsg.value = e instanceof Error ? e.message : `Failed to link ${otherNoun.value}.`;
      } finally {
        saving.value = false;
      }
    };

    const onCreated = (payload: CreatedForChain<Caretaker> | CreatedForChain<Patient>) => {
      if (addingCaretaker.value) {
        const c = (payload as CreatedForChain<Caretaker>).record;
        createdName.value = c.caretakerName;
        pendingLink.value = {
          id: c.caretakerId,
          relationship: payload.link?.relationship ?? null,
          isPrimary: payload.link?.isPrimary ?? true,
        };
      } else {
        const p = (payload as CreatedForChain<Patient>).record;
        createdName.value = p.patientName;
        pendingLink.value = {
          id: p.patientId,
          relationship: payload.link?.relationship ?? null,
          isPrimary: payload.link?.isPrimary ?? true,
        };
      }
      doPendingLink();
    };

    const doPendingLink = async () => {
      if (!pendingLink.value) return;
      saving.value = true;
      errorMsg.value = '';
      try {
        await link(pendingLink.value.id, pendingLink.value.isPrimary, pendingLink.value.relationship);
        successMsg.value = `${createdName.value} created and linked${pendingLink.value.isPrimary ? ' as primary' : ''}`;
        step.value = 'success';
        emit('linked');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'The record was created but linking failed.';
        step.value = 'link-failed';
      } finally {
        saving.value = false;
      }
    };

    const onCreateClosed = () => {
      // The form modal closes itself after a successful create — the pending link is already in
      // flight then. Only a user-cancelled form returns to the chooser.
      if (pendingLink.value) return;
      step.value = 'chooser';
    };

    const dismiss = () => emit('close');
    const finish = () => emit('close');

    return {
      step,
      options,
      saving,
      errorMsg,
      successMsg,
      createdName,
      addingCaretaker,
      otherNoun,
      otherLabel,
      canLink,
      canCreate,
      linkToCtx,
      openLink,
      doLink,
      onCreated,
      onCreateClosed,
      doPendingLink,
      dismiss,
      finish,
    };
  },
});
</script>
