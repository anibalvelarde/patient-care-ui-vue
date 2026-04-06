<template>
  <teleport to="body">
    <div v-if="visible && appointment" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-800">Session Details</h2>
            <button @click="$emit('close')" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mt-2">
            <StatusBadge :status-id="appointment.appointmentStatusId" :status-name="appointment.statusName" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          <!-- Session Info (always visible) -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-700">Appointment Info</h3>
            <div class="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Patient</span>
                <span class="font-medium text-slate-800">{{ appointment.patient }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Therapist</span>
                <span class="font-medium text-slate-800">{{ appointment.therapist }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Date</span>
                <span class="text-slate-700">{{ appointment.sessionDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Time</span>
                <span class="text-slate-700">{{ appointment.sessionTime }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500">Therapy Type</span>
                <span class="text-slate-700">
                  {{ appointment.therapyTypes || 'N/A' }}
                  <span v-if="appointment.isDiscovery" class="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Discovery</span>
                </span>
              </div>
              <div v-if="appointment.notes" class="pt-1 border-t border-slate-200">
                <span class="text-slate-500">Notes</span>
                <p class="text-slate-700 mt-0.5">{{ appointment.notes }}</p>
              </div>
            </div>
          </div>

          <!-- Financial Details (always visible, editable) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-700">Financial Details</h3>
              <button
                v-if="!editingFinancials"
                @click="startEditFinancials"
                class="text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                Edit
              </button>
            </div>

            <!-- Read-only view -->
            <div v-if="!editingFinancials" class="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Amount</span>
                <span class="font-medium text-slate-800">${{ appointment.amount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Discount</span>
                <span class="text-slate-700">${{ appointment.discount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Amount Paid</span>
                <span class="text-slate-700">${{ appointment.amountPaid.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-200 pt-2">
                <span class="text-slate-500 font-medium">Amount Due</span>
                <span :class="['font-bold', appointment.amountDue > 0 ? 'text-red-600' : 'text-green-600']">
                  ${{ appointment.amountDue.toFixed(2) }}
                </span>
              </div>
              <div v-if="appointment.isPastDue" class="text-xs text-red-600 font-medium">Past Due (35-day rule)</div>
            </div>

            <!-- Editable view -->
            <div v-else class="bg-violet-50 rounded-lg p-3 space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                  <input v-model.number="financialForm.amount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Discount</label>
                  <input v-model.number="financialForm.discount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Provider</label>
                  <input v-model.number="financialForm.providerAmount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="saveFinancials"
                  :disabled="actionInProgress"
                  class="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  {{ actionInProgress ? 'Saving...' : 'Save' }}
                </button>
                <button
                  @click="editingFinancials = false"
                  class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Confirm Section (only for Proposed) -->
          <div v-if="showConfirmSection" class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-700">Record Confirmation Attempt</h3>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Method</label>
              <select v-model="confirmForm.method" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="Text">Text</option>
                <option value="InPerson">In Person</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Result</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="result in ['Confirmed', 'NoAnswer', 'LeftMessage', 'Declined']"
                  :key="result"
                  @click="confirmForm.result = result"
                  :class="[
                    'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
                    confirmForm.result === result
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  {{ result === 'NoAnswer' ? 'No Answer' : result === 'LeftMessage' ? 'Left Message' : result }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input v-model="confirmForm.notes" type="text" placeholder="Optional..." class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button
              @click="handleConfirm"
              :disabled="!confirmForm.result || actionInProgress"
              :class="[
                'w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                !confirmForm.result || actionInProgress
                  ? 'bg-green-200 text-green-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700',
              ]"
            >
              {{ actionInProgress ? 'Saving...' : 'Submit Confirmation' }}
            </button>
          </div>

          <!-- Treatment Plan Section -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-700 flex items-center">
              <svg class="w-4 h-4 text-violet-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Treatment Plan
            </h3>
            <div v-if="isCompletedDiscovery" class="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
              <p class="text-sm text-violet-700 font-medium">Create a treatment plan from this discovery session</p>
              <button
                class="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                @click="createPlanFromDiscovery"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Treatment Plan
              </button>
            </div>
            <button
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
              @click="viewPatientPlans"
            >
              <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Patient's Treatment Plans
            </button>
          </div>

          <!-- Status Actions -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-700">Change Status</h3>
              <span v-if="isTerminalStatus" class="text-xs text-slate-400">Correction mode</span>
            </div>
            <!-- Confirmation warning for terminal statuses -->
            <div v-if="isTerminalStatus && !correctionConfirmed" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-xs text-amber-700">
                This session is <span class="font-semibold">{{ appointment.statusName }}</span>.
                Changing its status is a correction. Are you sure?
              </p>
              <button
                @click="correctionConfirmed = true"
                class="mt-2 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
              >
                Yes, allow status changes
              </button>
            </div>
            <div v-if="!isTerminalStatus || correctionConfirmed" class="grid grid-cols-2 gap-2">
              <button
                v-for="action in availableActions"
                :key="action.statusId"
                @click="handleStatusChange(action.statusId)"
                :disabled="actionInProgress"
                :class="[
                  'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
                  action.class,
                ]"
              >
                {{ action.label }}
              </button>
            </div>
          </div>

          <!-- Cancel with reason -->
          <div v-if="showCancelSection" class="space-y-2">
            <h3 class="text-sm font-semibold text-slate-700">Cancel Appointment</h3>
            <input v-model="cancelReason" type="text" placeholder="Reason (optional)" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button
              @click="handleCancel"
              :disabled="actionInProgress"
              class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
            >
              {{ actionInProgress ? 'Cancelling...' : 'Cancel Appointment' }}
            </button>
          </div>

          <!-- Error -->
          <div v-if="actionError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">{{ actionError }}</p>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import { useRouter } from 'vue-router';
import StatusBadge from './StatusBadge.vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import type { Appointment } from '../../interfaces/Appointment';

const TERMINAL_STATUSES = [3, 4, 5]; // Cancelled, Completed, NoShow

export default defineComponent({
  name: 'ActionsPanel',
  components: { StatusBadge },
  props: {
    visible: { type: Boolean, required: true },
    appointment: { type: Object as PropType<Appointment | null>, default: null },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const router = useRouter();
    const client = new SessionsHttpClient();
    const actionInProgress = ref(false);
    const actionError = ref('');
    const cancelReason = ref('');
    const confirmForm = ref({ method: 'Phone', result: '', notes: '' });
    const correctionConfirmed = ref(false);
    const editingFinancials = ref(false);
    const financialForm = ref({ amount: 0, discount: 0, providerAmount: 0 });

    const isTerminalStatus = computed(() => {
      const id = props.appointment?.appointmentStatusId;
      return id !== undefined && TERMINAL_STATUSES.includes(id);
    });

    const showConfirmSection = computed(() => props.appointment?.appointmentStatusId === 1);
    const showCancelSection = computed(() => {
      const id = props.appointment?.appointmentStatusId;
      return id !== undefined && id !== 3 && id !== 4 && id !== 5;
    });

    const isCompletedDiscovery = computed(() =>
      props.appointment?.isDiscovery === true && props.appointment?.appointmentStatusId === 4
    );

    const createPlanFromDiscovery = () => {
      if (!props.appointment) return;
      router.push({
        path: '/treatment-plans',
        query: {
          patientId: String(props.appointment.patientId),
          create: 'true',
          discoverySessionId: String(props.appointment.sessionId),
        },
      });
      emit('close');
    };

    const viewPatientPlans = () => {
      if (!props.appointment) return;
      router.push({
        path: '/treatment-plans',
        query: { patientId: String(props.appointment.patientId) },
      });
      emit('close');
    };

    const availableActions = computed(() => {
      const currentId = props.appointment?.appointmentStatusId;
      const actions = [
        { statusId: 1, label: 'Proposed', class: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
        { statusId: 2, label: 'Confirmed', class: 'border-green-200 text-green-700 hover:bg-green-50' },
        { statusId: 6, label: 'Checked In', class: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
        { statusId: 7, label: 'In Therapy', class: 'border-purple-200 text-purple-700 hover:bg-purple-50' },
        { statusId: 4, label: 'Completed', class: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
        { statusId: 5, label: 'No Show', class: 'border-red-200 text-red-700 hover:bg-red-50' },
      ];
      return actions.filter(a => a.statusId !== currentId);
    });

    const startEditFinancials = () => {
      if (!props.appointment) return;
      financialForm.value = {
        amount: props.appointment.amount,
        discount: props.appointment.discount,
        providerAmount: 0, // Not in the Appointment response — user can set
      };
      editingFinancials.value = true;
    };

    const saveFinancials = async () => {
      if (!props.appointment) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        await client.updateSession(props.appointment.sessionId, {
          sessionTime: props.appointment.sessionTime + (props.appointment.sessionTime.length === 5 ? ':00' : ''),
          therapyType: props.appointment.therapyTypes || 'N/A',
          duration: 60,
          amount: financialForm.value.amount,
          amountPaid: props.appointment.amountPaid,
          discount: financialForm.value.discount,
          providerAmount: financialForm.value.providerAmount,
          isPaidOff: props.appointment.isPaidOff,
          notes: props.appointment.notes,
          appointmentStatusId: props.appointment.appointmentStatusId,
        });
        editingFinancials.value = false;
        emit('updated');
      } catch (e: unknown) {
        actionError.value = e instanceof Error ? e.message : 'Failed to update financials.';
      } finally {
        actionInProgress.value = false;
      }
    };

    watch(() => props.visible, (val) => {
      if (val) {
        actionError.value = '';
        cancelReason.value = '';
        confirmForm.value = { method: 'Phone', result: '', notes: '' };
        correctionConfirmed.value = false;
        editingFinancials.value = false;
      }
    });

    const handleConfirm = async () => {
      if (!props.appointment || !confirmForm.value.result) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        await client.confirmSession(props.appointment.sessionId, {
          confirmationMethod: confirmForm.value.method,
          confirmationResult: confirmForm.value.result,
          notes: confirmForm.value.notes || undefined,
        });
        emit('updated');
        emit('close');
      } catch (e: unknown) {
        actionError.value = e instanceof Error ? e.message : 'Failed to confirm.';
      } finally {
        actionInProgress.value = false;
      }
    };

    const handleStatusChange = async (statusId: number) => {
      if (!props.appointment) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        const id = props.appointment.sessionId;
        switch (statusId) {
          case 1: // Can't directly set to Proposed via endpoint — use confirm with special handling
          case 2: await client.confirmSession(id, { confirmationMethod: 'InPerson', confirmationResult: 'Confirmed' }); break;
          case 4: await client.completeSession(id); break;
          case 5: await client.noShowSession(id); break;
          case 6: await client.checkInSession(id); break;
          case 7: await client.startTherapy(id); break;
        }
        emit('updated');
        emit('close');
      } catch (e: unknown) {
        actionError.value = e instanceof Error ? e.message : 'Failed to update status.';
      } finally {
        actionInProgress.value = false;
      }
    };

    const handleCancel = async () => {
      if (!props.appointment) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        await client.cancelSession(props.appointment.sessionId, cancelReason.value);
        emit('updated');
        emit('close');
      } catch (e: unknown) {
        actionError.value = e instanceof Error ? e.message : 'Failed to cancel.';
      } finally {
        actionInProgress.value = false;
      }
    };

    return {
      confirmForm, cancelReason, actionInProgress, actionError,
      correctionConfirmed, editingFinancials, financialForm, isTerminalStatus,
      showConfirmSection, showCancelSection, availableActions,
      isCompletedDiscovery, createPlanFromDiscovery, viewPatientPlans,
      startEditFinancials, saveFinancials,
      handleConfirm, handleStatusChange, handleCancel,
    };
  },
});
</script>
