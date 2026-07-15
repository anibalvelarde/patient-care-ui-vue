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
             caretaker-side (Caretakers.LinkPatient), not Patients.LinkCaretaker -->
        <button
          v-if="hasClaim('Permission', Permissions.CaretakersLinkPatient)"
          class="px-3 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          @click="confirmRemove(lc)"
        >
          Remove
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400 mb-4">No caretakers linked.</p>

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

    const doAdd = async (payload: { id: number; relationship: string | null; isPrimary: boolean }) => {
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

    onMounted(loadData);

    return {
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
