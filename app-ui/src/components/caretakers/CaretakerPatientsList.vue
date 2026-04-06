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
        Patients for {{ caretaker.caretakerName }}
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

    <!-- Linked patients list -->
    <div v-if="linkedPatients.length > 0" class="divide-y divide-slate-100 mb-4">
      <div
        v-for="lp in linkedPatients"
        :key="lp.patientId"
        class="flex items-center justify-between py-3"
      >
        <div class="flex items-center space-x-3">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ lp.patientName }}</p>
            <p class="text-xs text-slate-500">
              {{ lp.relationshipToPatient || 'No relationship' }}
            </p>
          </div>
          <span
            v-if="lp.isPrimaryCaretaker"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
          >
            Primary
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="px-3 py-1 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
            @click="viewPlans(lp.patientId)"
          >
            Plans
          </button>
          <button
            class="px-3 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            @click="confirmUnlink(lp)"
          >
            Unlink
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400 mb-4">No patients linked.</p>

    <!-- Unlink confirmation -->
    <div
      v-if="unlinkTarget"
      class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
    >
      <p class="text-sm text-red-700">
        Unlink <strong>{{ unlinkTarget.patientName }}</strong> from this caretaker?
      </p>
      <div class="flex items-center space-x-2 mt-2">
        <button
          class="px-3 py-1 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          :disabled="saving"
          @click="doUnlink"
        >
          Confirm
        </button>
        <button
          class="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          @click="unlinkTarget = null"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Link patient section -->
    <div class="border-t border-slate-200 pt-4">
      <button
        v-if="!showLinkForm"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        @click="showLinkForm = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Link Patient</span>
      </button>

      <div v-if="showLinkForm" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Patient</label>
          <select
            v-model="linkPatientId"
            class="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option :value="0" disabled>Select a patient...</option>
            <option
              v-for="p in availablePatients"
              :key="p.patientId"
              :value="p.patientId"
            >
              {{ p.patientName }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
          <select
            v-model="linkRelationship"
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
            id="link-primary"
            v-model="linkIsPrimary"
            type="checkbox"
            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="link-primary" class="text-sm text-slate-700">Primary caretaker</label>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
            :disabled="linkPatientId === 0 || saving"
            @click="doLink"
          >
            Link
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            @click="resetLinkForm"
          >
            Cancel
          </button>
        </div>
      </div>
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
import { useRouter } from 'vue-router';
import type { Caretaker, CaretakerPatientSummary } from '../../interfaces/Caretaker';
import type { Patient } from '../../interfaces/Patient';
import { CaretakersHttpClient } from '../../services/CaretakersHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';

export default defineComponent({
  name: 'CaretakerPatientsList',
  props: {
    caretaker: { type: Object as PropType<Caretaker>, required: true },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const router = useRouter();
    const caretakerClient = new CaretakersHttpClient();
    const patientClient = new PatientsHttpClient();

    const linkedPatients = ref<CaretakerPatientSummary[]>([]);
    const allPatients = ref<Patient[]>([]);
    const saving = ref(false);
    const errorMsg = ref('');
    const unlinkTarget = ref<CaretakerPatientSummary | null>(null);
    const showLinkForm = ref(false);
    const linkPatientId = ref(0);
    const linkRelationship = ref<string | null>(null);
    const linkIsPrimary = ref(true);

    const availablePatients = computed(() => {
      const linkedIds = new Set(linkedPatients.value.map((lp) => lp.patientId));
      return allPatients.value.filter((p) => !linkedIds.has(p.patientId));
    });

    const loadData = async () => {
      try {
        linkedPatients.value = await caretakerClient.getCaretakerPatients(props.caretaker.caretakerId);
        allPatients.value = await patientClient.getPatients();
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to load data.';
      }
    };

    const confirmUnlink = (lp: CaretakerPatientSummary) => {
      unlinkTarget.value = lp;
    };

    const doUnlink = async () => {
      if (!unlinkTarget.value) return;
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.unlinkPatient(props.caretaker.caretakerId, unlinkTarget.value.patientId);
        unlinkTarget.value = null;
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to unlink patient.';
      } finally {
        saving.value = false;
      }
    };

    const doLink = async () => {
      saving.value = true;
      errorMsg.value = '';
      try {
        await caretakerClient.linkPatient(
          props.caretaker.caretakerId,
          linkPatientId.value,
          linkIsPrimary.value,
          linkRelationship.value,
        );
        resetLinkForm();
        await loadData();
        emit('updated');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to link patient.';
      } finally {
        saving.value = false;
      }
    };

    const resetLinkForm = () => {
      showLinkForm.value = false;
      linkPatientId.value = 0;
      linkRelationship.value = null;
      linkIsPrimary.value = true;
    };

    const viewPlans = (patientId: number) => {
      router.push({ path: '/treatment-plans', query: { patientId: String(patientId) } });
    };

    onMounted(loadData);

    return {
      linkedPatients,
      availablePatients,
      saving,
      errorMsg,
      unlinkTarget,
      showLinkForm,
      linkPatientId,
      linkRelationship,
      linkIsPrimary,
      confirmUnlink,
      doUnlink,
      doLink,
      resetLinkForm,
      viewPlans,
    };
  },
});
</script>
