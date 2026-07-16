<template>
  <teleport to="body">
    <div v-if="visible && appointment" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
      <!-- Option B restyle (mock: patient-care-super/planning/mockups/session-details-restyle-options.html):
           672px panel, who/when in the header, people cards, financial stat strip,
           action groups collapsed behind <details> to keep the scroll shallow. -->
      <div class="relative w-full max-w-2xl bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
          <div class="flex items-start justify-between">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Session #{{ appointment.sessionId }} · {{ appointment.sessionDate }} · {{ appointment.sessionTime }}
              </p>
              <h2 class="text-xl font-semibold text-slate-800 mt-0.5 truncate">{{ appointment.patient }}</h2>
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge :status-id="appointment.appointmentStatusId" :status-name="appointment.statusName" />
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700">
                  {{ appointment.specialtyName || appointment.therapyTypes || 'N/A' }}
                </span>
                <span v-if="appointment.isDiscovery" class="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Discovery</span>
              </div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <AuditPopover :audit="appointment.audit" align="right" />
              <button class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" @click="$emit('close')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          <!-- People cards -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Therapist</p>
              <p class="font-medium text-slate-800 mt-1">{{ appointment.therapist }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ appointment.specialtyName || appointment.therapyTypes || 'N/A' }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 p-3">
              <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Caretaker</p>
              <p class="font-medium text-slate-800 mt-1">{{ appointment.caretakerName || '—' }}</p>
              <div v-if="appointment.caretakerName" class="text-xs text-slate-500 mt-0.5 space-y-0.5">
                <p v-if="appointment.caretakerPhone" class="flex items-center gap-1.5">
                  <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {{ appointment.caretakerPhone }}
                </p>
                <p v-if="appointment.caretakerEmail" class="flex items-center gap-1.5 min-w-0">
                  <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="truncate" :title="appointment.caretakerEmail">{{ appointment.caretakerEmail }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="appointment.notes" class="rounded-xl border border-slate-200 p-3">
            <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Notes</p>
            <p class="text-sm text-slate-700 mt-1 whitespace-pre-line">{{ appointment.notes }}</p>
          </div>

          <!-- Financial -->
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">Financial</p>
              <button
                v-if="!editingFinancials"
                @click="startEditFinancials"
                class="text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                Edit
              </button>
            </div>

            <!-- Read-only stat strip -->
            <div v-if="!editingFinancials">
              <!-- WP-17: the Provider tile is claim-gated (Appointments.ProviderAmount, MGR/AM);
                   the API omits the figure for other callers, so FD renders a 4-tile strip. -->
              <div :class="['mt-2 grid gap-2 text-center', hasClaim('Permission', Permissions.AppointmentsProviderAmount) ? 'grid-cols-5' : 'grid-cols-4']">
                <div class="rounded-lg bg-slate-50 py-2">
                  <p class="text-[11px] text-slate-500">Amount</p>
                  <p class="text-sm font-semibold text-slate-800">${{ appointment.amount.toFixed(2) }}</p>
                </div>
                <div class="rounded-lg bg-slate-50 py-2">
                  <p class="text-[11px] text-slate-500">Discount</p>
                  <p class="text-sm font-semibold text-slate-800">${{ appointment.discount.toFixed(2) }}</p>
                </div>
                <div class="rounded-lg bg-slate-50 py-2">
                  <p class="text-[11px] text-slate-500">Paid</p>
                  <p class="text-sm font-semibold text-green-600">${{ appointment.amountPaid.toFixed(2) }}</p>
                </div>
                <div v-if="hasClaim('Permission', Permissions.AppointmentsProviderAmount)" class="rounded-lg bg-slate-50 py-2">
                  <p class="text-[11px] text-slate-500">Provider</p>
                  <p class="text-sm font-semibold text-violet-600">${{ (appointment.providerAmount ?? 0).toFixed(2) }}</p>
                </div>
                <div :class="['rounded-lg py-2', appointment.amountDue > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100']">
                  <p :class="['text-[11px] font-medium', appointment.amountDue > 0 ? 'text-red-500' : 'text-green-600']">Due</p>
                  <p :class="['text-sm font-bold', appointment.amountDue > 0 ? 'text-red-600' : 'text-green-600']">${{ appointment.amountDue.toFixed(2) }}</p>
                </div>
              </div>
              <div v-if="appointment.isPastDue" class="mt-2 text-xs text-red-600 font-medium">Past Due (35-day rule)</div>
            </div>

            <!-- Editable view -->
            <div v-else class="mt-2 bg-violet-50 rounded-lg p-3 space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                  <input v-model.number="financialForm.amount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Discount</label>
                  <input v-model.number="financialForm.discount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <!-- WP-17C: cosmetic only — the API still returns ProviderAmount to anyone with Appointments.View; true field-level enforcement needs API response-shaping (deferred). -->
                <div v-if="hasClaim('Permission', Permissions.AppointmentsProviderAmount)">
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

          <!-- Record Confirmation Attempt (only for Proposed) -->
          <details
            v-if="showConfirmSection && hasClaim('Permission', Permissions.AppointmentsBook)"
            class="group rounded-xl border border-slate-200"
            open
          >
            <summary class="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span class="text-sm font-semibold text-slate-700">Record Confirmation Attempt</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-3 pb-3 space-y-2.5 border-t border-slate-100 pt-2.5">
              <div class="grid grid-cols-2 gap-2">
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
                  <label class="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <input v-model="confirmForm.notes" type="text" placeholder="Optional..." class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Result</label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="result in ['Confirmed', 'NoAnswer', 'LeftMessage', 'Declined']"
                    :key="result"
                    @click="confirmForm.result = result"
                    :class="[
                      'px-2 py-2 text-xs font-medium rounded-lg border transition-colors',
                      confirmForm.result === result
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    ]"
                  >
                    {{ result === 'NoAnswer' ? 'No Answer' : result === 'LeftMessage' ? 'Left Message' : result }}
                  </button>
                </div>
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
          </details>

          <!-- Change Status & Treatment Plan -->
          <details class="group rounded-xl border border-slate-200">
            <summary class="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span class="text-sm font-semibold text-slate-700">
                Change Status &amp; Treatment Plan
                <span v-if="isTerminalStatus" class="ml-2 text-xs font-normal text-slate-400">Correction mode</span>
              </span>
              <svg class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-3 pb-3 space-y-3 border-t border-slate-100 pt-2.5">
              <template v-if="hasClaim('Permission', Permissions.AppointmentsBook)">
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
                <div v-if="!isTerminalStatus || correctionConfirmed" class="grid grid-cols-3 gap-2">
                  <button
                    v-for="action in availableActions"
                    :key="action.statusId"
                    @click="handleStatusChange(action.statusId)"
                    :disabled="actionInProgress"
                    :class="[
                      'px-2 py-2 text-xs font-medium rounded-lg border transition-colors',
                      action.class,
                    ]"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </template>
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
          </details>

          <!-- Cancel with reason -->
          <details
            v-if="showCancelSection && hasClaim('Permission', Permissions.AppointmentsBook)"
            class="group rounded-xl border border-red-100"
          >
            <summary class="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span class="text-sm font-semibold text-red-700">Cancel Appointment</span>
              <svg class="w-4 h-4 text-red-300 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-3 pb-3 border-t border-red-50 pt-2.5 flex items-center gap-2">
              <input v-model="cancelReason" type="text" placeholder="Reason (optional)" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <button
                @click="handleCancel"
                :disabled="actionInProgress"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors flex-shrink-0"
              >
                {{ actionInProgress ? 'Cancelling...' : 'Cancel Appointment' }}
              </button>
            </div>
          </details>

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
import AuditPopover from '../shared/AuditPopover.vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import type { Appointment } from '../../interfaces/Appointment';
import { useClaims, Permissions } from '../../composables/useClaims';

const TERMINAL_STATUSES = [3, 4, 5]; // Cancelled, Completed, NoShow

export default defineComponent({
  name: 'ActionsPanel',
  components: { StatusBadge, AuditPopover },
  props: {
    visible: { type: Boolean, required: true },
    appointment: { type: Object as PropType<Appointment | null>, default: null },
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const { hasClaim } = useClaims();
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
      hasClaim, Permissions,
    };
  },
});
</script>
