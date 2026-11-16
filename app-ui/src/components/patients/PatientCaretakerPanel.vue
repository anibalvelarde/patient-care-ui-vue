<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="$emit('close')"></div>
      <!-- Panel -->
      <div class="fixed inset-y-0 right-0 flex max-w-md w-full">
        <div class="relative w-full bg-white shadow-xl overflow-y-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-800">
        Caretakers for {{ patient.patientName }}
      </h3>
      <button
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Close"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- WP-62 (ruling Q-4): a patient keeps at least one primary caretaker. Legacy patients
         can be linked with none — say so, and let staff fix it with "Make primary". -->
    <div
      v-if="linkedCaretakers.length > 0 && primaryCount === 0"
      class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800"
      data-testid="no-primary-banner"
    >
      This patient has no primary caretaker. Use <strong>Make primary</strong> on one of them.
    </div>

    <!-- Linked caretakers list -->
    <div v-if="linkedCaretakers.length > 0" class="divide-y divide-slate-100 mb-4">
      <div
        v-for="lc in linkedCaretakers"
        :key="lc.caretakerId"
        class="flex items-center justify-between py-3"
      >
        <div class="flex items-center space-x-3">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ lc.caretakerName }}</p>
            <p class="text-xs text-slate-500">
              {{ lc.relationshipToPatient || 'No relationship' }}
            </p>
          </div>
          <span
            v-if="lc.isPrimaryCaretaker"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
          >
            Primary
          </span>
        </div>
        <!-- WP-27 claim hygiene: gate on the claim the API enforces — link/unlink is
             caretaker-side (Caretakers.LinkPatient), not Patients.LinkCaretaker.
             WP-50: a "Self" link is permanent (the API 409s an unlink), so no Remove for it.
             WP-62: the last primary can't be un-flagged or removed (the API 409s both). -->
        <div v-if="canLink" class="flex items-center space-x-1">
          <button
            v-if="!lc.isPrimaryCaretaker"
            data-testid="make-primary"
            class="px-2 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            :disabled="saving"
            @click="setPrimary(lc, true)"
          >
            Make primary
          </button>
          <button
            v-else
            data-testid="remove-primary"
            class="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="saving || isLastPrimary(lc)"
            :title="isLastPrimary(lc) ? lastPrimaryHint : ''"
            @click="setPrimary(lc, false)"
          >
            Remove primary
          </button>
          <button
            v-if="!isSelfRelationship(lc.relationshipToPatient)"
            data-testid="remove-caretaker"
            class="px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="isLastPrimary(lc)"
            :title="isLastPrimary(lc) ? lastPrimaryHint : ''"
            @click="confirmRemove(lc)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400 mb-4">No caretakers linked.</p>
    <p v-if="hasLockedPrimary" class="text-xs text-slate-500 -mt-2 mb-4" data-testid="last-primary-hint">
      {{ lastPrimaryHint }}
    </p>

    <!-- Remove confirmation -->
    <div
      v-if="removeTarget"
      class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
    >
      <p class="text-sm text-red-700">
        Remove <strong>{{ removeTarget.caretakerName }}</strong> from this patient?
      </p>
      <div class="flex items-center space-x-2 mt-2">
        <button
          class="px-3 py-1 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          :disabled="saving"
          @click="doRemove"
        >
          Confirm
        </button>
        <button
          class="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          @click="removeTarget = null"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Add caretaker section -->
    <div class="border-t border-slate-200 pt-4">
      <!-- WP-62 (owner correction after WP-50): adult patients already on file can become their own
           caretaker here, not only in the post-create chooser. A dedicated action, never a picker
           entry (WP-56 G4): the Self link reuses the patient's own login identity. -->
      <div v-if="showSelfConfirm" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3" data-testid="self-confirm">
        <p class="text-sm text-blue-800">
          Make <strong>{{ patient.patientName }}</strong> their own caretaker? This can't be undone in the app.
        </p>
        <label class="flex items-center space-x-2 mt-2 text-sm text-slate-700">
          <input v-model="selfIsPrimary" type="checkbox" data-testid="self-primary-checkbox" class="rounded border-slate-300 text-blue-600" />
          <span>Primary caretaker</span>
        </label>
        <div class="flex items-center space-x-2 mt-2">
          <button
            data-testid="self-confirm-yes"
            class="px-3 py-1 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            :disabled="saving"
            @click="doMakeSelf"
          >
            Confirm
          </button>
          <button
            class="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            @click="showSelfConfirm = false"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        v-if="canLink && !hasSelfLink && !showSelfConfirm && !showAddForm"
        data-testid="make-self-caretaker"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors mb-1"
        @click="openSelfConfirm"
      >
        <span>This patient is their own caretaker</span>
      </button>
      <button
        v-if="!showAddForm && hasClaim('Permission', Permissions.CaretakersLinkPatient)"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        @click="showAddForm = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Caretaker</span>
      </button>

      <!-- WP-27: shared link form (also used by CaretakerPatientsList + the cross-add chain) -->
      <CaretakerLinkForm
        v-if="showAddForm"
        entity-label="Caretaker"
        :fetch-options="fetchCaretakerOptions"
        :exclude-ids="linkedCaretakerIds"
        :saving="saving"
        :default-primary="primaryCount === 0"
        submit-label="Add"
        @submit="doAdd"
        @cancel="showAddForm = false"
      />
    </div>

    <!-- Error message -->
    <p v-if="errorMsg" class="text-sm text-red-600 mt-3">{{ errorMsg }}</p>

    <!-- Close button -->
    <div class="border-t border-slate-200 pt-4 mt-4">
      <button
        class="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, type PropType } from 'vue';
import type { Patient, PatientCaretakerSummary } from '../../interfaces/Patient';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { useClaims, Permissions } from '../../composables/useClaims';
import CaretakerLinkForm, { type LookupOption } from '../shared/CaretakerLinkForm.vue';
import { isSelfRelationship, type CaretakerRelationshipValue } from '../../constants/caretakerRelationships';
import { isConflict } from '../../services/ApiError';

export default defineComponent({
  name: 'PatientCaretakerPanel',
  components: { CaretakerLinkForm },
  props: {
    patient: { type: Object as PropType<Patient>, required: true },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const { hasClaim } = useClaims();
    const caretakerClient = new CaretakersHttpClient();
    const patientClient = new PatientsHttpClient();

    const linkedCaretakers = ref<PatientCaretakerSummary[]>([]);
    const saving = ref(false);
    const errorMsg = ref('');
    const removeTarget = ref<PatientCaretakerSummary | null>(null);
    const showAddForm = ref(false);

    const canLink = computed(() => hasClaim('Permission', Permissions.CaretakersLinkPatient));

    // WP-62 (ruling Q-4): at least one primary; several are fine.
    const primaryCount = computed(() => linkedCaretakers.value.filter((lc) => lc.isPrimaryCaretaker).length);
    const isLastPrimary = (lc: PatientCaretakerSummary) => lc.isPrimaryCaretaker && primaryCount.value === 1;
    const hasLockedPrimary = computed(() => canLink.value && primaryCount.value === 1);
    const lastPrimaryHint = 'The only primary caretaker can’t be removed — make another caretaker primary first.';
    const hasSelfLink = computed(() => linkedCaretakers.value.some((lc) => isSelfRelationship(lc.relationshipToPatient)));

    const showSelfConfirm = ref(false);
    const selfIsPrimary = ref(true);

    // WP-30: the add form searches the lookup endpoint; already-linked caretakers are excluded.
    const linkedCaretakerIds = computed(() => linkedCaretakers.value.map((lc) => lc.caretakerId));

    const fetchCaretakerOptions = async (q: string): Promise<LookupOption[]> =>
      (await caretakerClient.lookupCaretakers(q)).map((c) => ({ id: c.caretakerId, name: c.caretakerName }));

    const loadData = async () => {
      try {
        linkedCaretakers.value = await patientClient.getPatientCaretakers(props.patient.patientId);
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to load data.';
      }
    };

    const confirmRemove = (lc: PatientCaretakerSummary) => {
      removeTarget.value = lc;
    };

    const doRemove = async () => {
      if (!removeTarget.value) return;
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.unlinkPatient(removeTarget.value.caretakerId, props.patient.patientId);
        removeTarget.value = null;
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to remove caretaker.';
      } finally {
        saving.value = false;
      }
    };

    const doAdd = async (payload: { id: number; relationship: CaretakerRelationshipValue | null; isPrimary: boolean }) => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.linkPatient(
          payload.id,
          props.patient.patientId,
          payload.isPrimary,
          payload.relationship,
        );
        showAddForm.value = false;
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to add caretaker.';
      } finally {
        saving.value = false;
      }
    };

    const setPrimary = async (lc: PatientCaretakerSummary, isPrimary: boolean) => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.setPrimary(lc.caretakerId, props.patient.patientId, isPrimary);
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to update the primary caretaker.';
      } finally {
        saving.value = false;
      }
    };

    const openSelfConfirm = () => {
      selfIsPrimary.value = primaryCount.value === 0;
      showSelfConfirm.value = true;
    };

    const doMakeSelf = async () => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.makeSelfCaretaker(props.patient.patientId, selfIsPrimary.value);
        showSelfConfirm.value = false;
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        if (isConflict(e)) {
          errorMsg.value = 'This patient is already their own caretaker.';
          showSelfConfirm.value = false;
          await loadData();
        } else {
          errorMsg.value = e instanceof Error ? e.message : 'Failed to make the patient their own caretaker.';
        }
      } finally {
        saving.value = false;
      }
    };

    onMounted(loadData);

    return {
      canLink,
      primaryCount,
      isLastPrimary,
      hasLockedPrimary,
      lastPrimaryHint,
      hasSelfLink,
      showSelfConfirm,
      selfIsPrimary,
      setPrimary,
      openSelfConfirm,
      doMakeSelf,
      isSelfRelationship,
      linkedCaretakers,
      linkedCaretakerIds,
      fetchCaretakerOptions,
      saving,
      errorMsg,
      removeTarget,
      showAddForm,
      confirmRemove,
      doRemove,
      doAdd,
      hasClaim,
      Permissions,
    };
  },
});
</script>
