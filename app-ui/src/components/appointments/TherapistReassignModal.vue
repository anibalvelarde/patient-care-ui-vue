<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-slate-200">
          <h3 class="text-sm font-semibold text-slate-800">Reassign Therapist</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ session?.patient }} &middot; {{ session?.specialtyAbbreviation || session?.therapyTypes }}
          </p>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Current Therapist</label>
            <p class="text-sm text-slate-700">{{ session?.therapist }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">New Therapist</label>
            <select
              v-model.number="selectedTherapistId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option :value="0" disabled>Select a therapist...</option>
              <option
                v-for="t in eligibleTherapists"
                :key="t.therapistId"
                :value="t.therapistId"
                :disabled="t.therapistId === session?.therapistId"
              >
                {{ t.therapistName }}{{ t.therapistId === session?.therapistId ? ' (current)' : '' }}
              </option>
            </select>
            <p v-if="eligibleTherapists.length === 0 && !loading" class="text-xs text-amber-600 mt-1">
              No therapists found with the required specialty.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            :disabled="!canSave || saving"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              canSave && !saving
                ? 'text-white bg-violet-600 hover:bg-violet-700'
                : 'text-white bg-violet-300 cursor-not-allowed',
            ]"
            @click="handleSave"
          >
            {{ saving ? 'Saving...' : 'Reassign' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="px-5 py-2 bg-red-50 border-t border-red-200">
          <p class="text-xs text-red-700">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import type { Appointment } from '../../interfaces/Appointment';
import type { Therapist } from '../../interfaces/Therapist';
import { TherapistsHttpClient } from '../../services/TherapistsHttpClient';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';

export default defineComponent({
  name: 'TherapistReassignModal',
  props: {
    visible: { type: Boolean, default: false },
    session: { type: Object as PropType<Appointment | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const therapistsClient = new TherapistsHttpClient();
    const sessionsClient = new SessionsHttpClient();

    const allTherapists = ref<Therapist[]>([]);
    const selectedTherapistId = ref(0);
    const saving = ref(false);
    const errorMsg = ref('');
    const loading = ref(false);

    const eligibleTherapists = computed(() => {
      const specId = props.session?.specialtyTypeId;
      if (!specId) return allTherapists.value;
      return allTherapists.value.filter(t =>
        t.specialties?.some(s => s.specialtyId === specId)
      );
    });

    const canSave = computed(() =>
      selectedTherapistId.value > 0 &&
      selectedTherapistId.value !== props.session?.therapistId
    );

    const loadTherapists = async () => {
      loading.value = true;
      try {
        allTherapists.value = await therapistsClient.getTherapists();
      } catch {
        // Non-fatal
      } finally {
        loading.value = false;
      }
    };

    const handleSave = async () => {
      if (!props.session || !canSave.value) return;
      saving.value = true;
      errorMsg.value = '';
      try {
        await sessionsClient.updateSession(props.session.sessionId, {
          therapistId: selectedTherapistId.value,
          sessionTime: props.session.sessionTime,
          therapyType: props.session.therapyTypes || 'N/A',
          duration: 60,
          amount: props.session.amount,
          amountPaid: props.session.amountPaid,
          discount: props.session.discount,
          providerAmount: props.session.providerAmount,
          isPaidOff: props.session.isPaidOff,
          notes: props.session.notes || '',
          appointmentStatusId: props.session.appointmentStatusId,
          siteId: props.session.siteId,
          specialtyTypeId: props.session.specialtyTypeId,
        });
        emit('saved');
        emit('close');
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to reassign therapist.';
      } finally {
        saving.value = false;
      }
    };

    watch(() => props.visible, (val) => {
      if (val) {
        selectedTherapistId.value = 0;
        errorMsg.value = '';
        loadTherapists();
      }
    });

    return {
      eligibleTherapists,
      selectedTherapistId,
      canSave,
      saving,
      errorMsg,
      loading,
      handleSave,
    };
  },
});
</script>
