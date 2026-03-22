<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
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
        <button
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
        v-if="!showAddForm"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        @click="showAddForm = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Caretaker</span>
      </button>

      <div v-if="showAddForm" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Caretaker</label>
          <select
            v-model="addCaretakerId"
            class="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="0" disabled>Select a caretaker...</option>
            <option
              v-for="c in availableCaretakers"
              :key="c.caretakerId"
              :value="c.caretakerId"
            >
              {{ c.caretakerName }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
          <select
            v-model="addRelationship"
            class="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="null">None</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Relative">Relative</option>
            <option value="HiredHelp">Hired Help</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <input
            id="add-primary"
            v-model="addIsPrimary"
            type="checkbox"
            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="add-primary" class="text-sm text-slate-700">Primary caretaker</label>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            :disabled="addCaretakerId === 0 || saving"
            @click="doAdd"
          >
            Add
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            @click="resetAddForm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <p v-if="errorMsg" class="text-sm text-red-600 mt-3">{{ errorMsg }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, type PropType } from 'vue';
import type { Patient, PatientCaretakerSummary } from '../../interfaces/Patient';
import type { Caretaker } from '../../interfaces/Caretaker';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';

export default defineComponent({
  name: 'PatientCaretakerPanel',
  props: {
    patient: { type: Object as PropType<Patient>, required: true },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const caretakerClient = new CaretakersHttpClient();
    const patientClient = new PatientsHttpClient();

    const linkedCaretakers = ref<PatientCaretakerSummary[]>([]);
    const allCaretakers = ref<Caretaker[]>([]);
    const saving = ref(false);
    const errorMsg = ref('');
    const removeTarget = ref<PatientCaretakerSummary | null>(null);
    const showAddForm = ref(false);
    const addCaretakerId = ref(0);
    const addRelationship = ref<string | null>(null);
    const addIsPrimary = ref(false);

    const availableCaretakers = computed(() => {
      const linkedIds = new Set(linkedCaretakers.value.map((lc) => lc.caretakerId));
      return allCaretakers.value.filter((c) => !linkedIds.has(c.caretakerId));
    });

    const loadData = async () => {
      try {
        linkedCaretakers.value = await patientClient.getPatientCaretakers(props.patient.patientId);
        allCaretakers.value = await caretakerClient.getCaretakers();
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

    const doAdd = async () => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.linkPatient(
          addCaretakerId.value,
          props.patient.patientId,
          addIsPrimary.value,
          addRelationship.value,
        );
        resetAddForm();
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to add caretaker.';
      } finally {
        saving.value = false;
      }
    };

    const resetAddForm = () => {
      showAddForm.value = false;
      addCaretakerId.value = 0;
      addRelationship.value = null;
      addIsPrimary.value = false;
    };

    onMounted(loadData);

    return {
      linkedCaretakers,
      availableCaretakers,
      saving,
      errorMsg,
      removeTarget,
      showAddForm,
      addCaretakerId,
      addRelationship,
      addIsPrimary,
      confirmRemove,
      doRemove,
      doAdd,
      resetAddForm,
    };
  },
});
</script>
