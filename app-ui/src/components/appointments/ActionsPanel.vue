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
                  <input v-model.number="financialForm.amount" type="number" min="0" step="0.01" data-testid="edit-amount-input" class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Discount</label>
                  <!-- WP-40 (BK-3): editing the discount is gated on Sessions.Discount.Edit
                       (AM/MGR) — the API 403s a changed discount without it. -->
                  <input
                    v-if="canEditDiscount"
                    v-model.number="financialForm.discount"
                    type="number" :min="editSenadisFloor" step="0.01"
                    data-testid="edit-discount-input"
                    class="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <p v-else data-testid="edit-discount-readonly" class="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-sm text-slate-500">
                    ${{ financialForm.discount.toFixed(2) }}
                  </p>
                  <p v-if="canEditDiscount && editSenadisActive" data-testid="edit-senadis-floor-hint" class="mt-1 text-[11px] text-violet-600">
                    SENADIS floor: min ${{ editSenadisFloor.toFixed(2) }} (20%) — may go up, never below.
                  </p>
                  <!-- WP-49 (ruling 4): distinguish the two reasons a discount is read-only,
                       so the operator isn't left guessing which rule they hit. -->
                  <p v-else-if="carriesFee" data-testid="edit-discount-fee-locked" class="mt-1 text-[11px] text-amber-600">
                    This session carries a fee — changing the discount needs Manager fee rights.
                    Use Waive Fee instead of discounting it away.
                  </p>
                  <p v-else class="mt-1 text-[11px] text-slate-400">
                    Discount edits need a Manager / Assistant Manager.
                  </p>
                </div>
                <!-- WP-40: the manual Provider input is gone — the API derives the fee from the
                     therapist's model and recomputes whenever amount/discount change. -->
                <div v-if="hasClaim('Permission', Permissions.AppointmentsProviderAmount)">
                  <label class="block text-xs font-medium text-slate-600 mb-1">Provider</label>
                  <p data-testid="edit-provider-display" class="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-sm text-slate-500">
                    ${{ (appointment.providerAmount ?? 0).toFixed(2) }}
                  </p>
                  <p class="mt-1 text-[11px] text-slate-400">Recomputed on save.</p>
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

          <!-- WP-49 (BR4): Fees. Appears only on sessions that actually carry one, so the
               panel stays quiet for the overwhelming majority of sessions. -->
          <details v-if="showFeesSection" class="group rounded-xl border border-slate-200" data-testid="fees-section">
            <summary class="flex items-center justify-between px-3 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span class="text-sm font-semibold text-slate-700">Fees</span>
              <svg class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="px-3 pb-3 space-y-2">
              <div v-if="hasWaivableLateFee" class="flex justify-between text-sm" data-testid="fees-late-line">
                <span class="text-slate-600">Late chargeback</span>
                <span class="font-medium text-slate-800">${{ (appointment.lateFeeAmount ?? 0).toFixed(2) }}</span>
              </div>
              <div v-if="hasWaivableNoShowFee" class="flex justify-between text-sm" data-testid="fees-noshow-line">
                <span class="text-slate-600">No-show fee</span>
                <span class="font-medium text-slate-800">${{ (appointment.amount - appointment.discount).toFixed(2) }}</span>
              </div>
              <p v-if="appointment.feeWaivedOn" class="text-[11px] text-slate-500" data-testid="fees-waived-note">
                A fee on this session was waived on {{ appointment.feeWaivedOn }}. See the session notes for the reason.
              </p>
              <p v-else-if="!hasWaivableLateFee && !hasWaivableNoShowFee" class="text-[11px] text-slate-400">
                No fee is currently outstanding on this session.
              </p>

              <button
                v-if="hasWaivableLateFee || hasWaivableNoShowFee"
                :disabled="!canWaiveFee"
                :title="canWaiveFee ? '' : 'Waiving a fee is a manager action.'"
                data-testid="waive-fee-btn"
                class="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="waiveModalVisible = true"
              >
                Waive Fee
              </button>
              <p v-if="(hasWaivableLateFee || hasWaivableNoShowFee) && !canWaiveFee" class="text-[11px] text-slate-400">
                Waiving a fee is a manager action.
              </p>
            </div>
          </details>

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
                    :data-testid="`confirm-result-${result.toLowerCase()}`"
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
              <!-- WP-42: Declined routes to Cancelled and zeroes the session's money -->
              <div
                v-if="confirmForm.result === 'Declined' && appointment.amount > 0"
                data-testid="declined-money-note"
                class="bg-amber-50 border border-amber-200 rounded-lg p-2.5"
              >
                <p class="text-xs text-amber-700">
                  Recording <span class="font-semibold">Declined</span> cancels this session and
                  zeroes its money (amount ${{ appointment.amount.toFixed(2) }}, discount, therapist
                  pay). The original figures are stamped into the session notes.
                </p>
              </div>
              <button
                data-testid="confirm-submit-btn"
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
                    :data-testid="`status-action-${action.statusId}`"
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
                <!-- WP-42: no-show confirm step — states the fee before the transition fires.
                     The line is display-only; the API applies the authoritative fee. -->
                <div
                  v-if="noShowConfirmPending"
                  data-testid="noshow-confirm"
                  class="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2"
                >
                  <p data-testid="noshow-fee-line" class="text-xs text-red-700">{{ noShowFeeMessage }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      data-testid="noshow-confirm-btn"
                      @click="confirmNoShow"
                      :disabled="actionInProgress"
                      class="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {{ actionInProgress ? 'Saving...' : 'Mark No Show' }}
                    </button>
                    <button
                      data-testid="noshow-back-btn"
                      @click="noShowConfirmPending = false"
                      class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Back
                    </button>
                  </div>
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
            <div class="px-3 pb-3 border-t border-red-50 pt-2.5 space-y-2">
              <!-- WP-42: pre-confirm money note — only when the session currently carries money -->
              <div
                v-if="appointment.amount > 0"
                data-testid="cancel-money-note"
                class="bg-amber-50 border border-amber-200 rounded-lg p-2.5"
              >
                <p class="text-xs text-amber-700">
                  Cancelling zeroes this session's money (amount
                  ${{ appointment.amount.toFixed(2) }}, discount, therapist pay). The original
                  figures are stamped into the session notes.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <input v-model="cancelReason" type="text" placeholder="Reason (optional)" class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <button
                  data-testid="cancel-appointment-btn"
                  @click="handleCancel"
                  :disabled="actionInProgress"
                  class="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors flex-shrink-0"
                >
                  {{ actionInProgress ? 'Cancelling...' : 'Cancel Appointment' }}
                </button>
              </div>
            </div>
          </details>

          <!-- Error (WP-42: guard/lock 400 details from the API render verbatim here) -->
          <div v-if="actionError" data-testid="action-error" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">{{ actionError }}</p>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- WP-49 (BR4). Sits outside the panel's teleport so it stacks above it (z-60 vs z-50). -->
  <WaiveFeeModal
    :visible="waiveModalVisible"
    :appointment="appointment"
    @close="waiveModalVisible = false"
    @waived="onFeeWaived"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import { useRouter } from 'vue-router';
import StatusBadge from './StatusBadge.vue';
import AuditPopover from '../shared/AuditPopover.vue';
import WaiveFeeModal from './WaiveFeeModal.vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { PatientsHttpClient } from '../../services/PatientsHttpClient';
import { SitesHttpClient } from '../../services/SitesHttpClient';
import type { Appointment } from '../../interfaces/Appointment';
import { useClaims, Permissions } from '../../composables/useClaims';
import { isSenadisExpired } from '../../utils/senadis';

const TERMINAL_STATUSES = [3, 4, 5]; // Cancelled, Completed, NoShow

export default defineComponent({
  name: 'ActionsPanel',
  components: { StatusBadge, AuditPopover, WaiveFeeModal },
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
    // WP-40: no providerAmount here — the fee is server-derived, never hand-entered.
    const financialForm = ref({ amount: 0, discount: 0 });
    const patientsClient = new PatientsHttpClient();
    const sitesClient = new SitesHttpClient();
    // WP-42: no-show confirm step state. The fee line is display-only (best-effort from the
    // session's Site); the API applies the authoritative fee at transition.
    const noShowConfirmPending = ref(false);
    const noShowFeeMessage = ref('');
    const NOSHOW_GENERIC_MESSAGE = "The site's no-show fee will apply to this session.";
    // WP-40 (BK-3): whether the session's patient has SENADIS active AT THE SESSION DATE —
    // drives the floor hint (the API enforces the floor regardless).
    const editSenadisActive = ref(false);
    const canManageFees = computed(() => hasClaim('Permission', Permissions.SessionsFeeManage));
    // WP-49 (ruling 4): on a FEE-BEARING session a discount edit needs Sessions.Fee.Manage as
    // well, because setting discount = amount would erase the fee — the same money as a waiver
    // with none of the record. The API 403s regardless; mirroring it here means an AM sees a
    // read-only field with a reason instead of a control that always fails on save.
    const carriesFee = computed(() => props.appointment?.carriesFee ?? false);
    const canEditDiscount = computed(() =>
      hasClaim('Permission', Permissions.SessionsDiscountEdit)
      && (!carriesFee.value || canManageFees.value));

    // Waive is offered only when there is actually something to forgive. A late fee already
    // waived reads 0.00 with its latch still set, so it must not re-open the modal.
    const hasWaivableLateFee = computed(() => (props.appointment?.lateFeeAmount ?? 0) > 0);
    const hasWaivableNoShowFee = computed(() => {
      const a = props.appointment;
      if (!a) return false;
      return (a.notes?.includes('[NOSHOW-FEE') ?? false) && a.amount - a.discount > 0;
    });
    const showFeesSection = computed(() =>
      carriesFee.value || hasWaivableLateFee.value || hasWaivableNoShowFee.value);
    const canWaiveFee = computed(() =>
      canManageFees.value && (hasWaivableLateFee.value || hasWaivableNoShowFee.value));
    const waiveModalVisible = ref(false);

    const onFeeWaived = () => {
      waiveModalVisible.value = false;
      emit('updated');
    };
    const editSenadisFloor = computed(() =>
      editSenadisActive.value ? Math.round(0.20 * financialForm.value.amount * 100) / 100 : 0
    );

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

    const startEditFinancials = async () => {
      if (!props.appointment) return;
      financialForm.value = {
        amount: props.appointment.amount,
        discount: props.appointment.discount,
      };
      editingFinancials.value = true;
      // WP-40 (BK-3): floor hint — active SENADIS (expiry-aware, at the SESSION date).
      editSenadisActive.value = false;
      try {
        const patient = await patientsClient.getPatient(props.appointment.patientId);
        editSenadisActive.value = patient.hasSenadisDiscount === true
          && !isSenadisExpired(patient.senadisExpirationDate ?? null, props.appointment.sessionDate);
      } catch {
        // Hint only — the API enforces the floor server-side regardless
      }
    };

    const saveFinancials = async () => {
      if (!props.appointment) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        // WP-40: duration is OMITTED (the read model doesn't carry it — the API keeps the
        // stored value; the old hardcoded 60 silently overwrote legacy durations) and
        // providerAmount is no longer sent (server-derived, recomputed on money change).
        await client.updateSession(props.appointment.sessionId, {
          sessionTime: props.appointment.sessionTime + (props.appointment.sessionTime.length === 5 ? ':00' : ''),
          therapyType: props.appointment.therapyTypes || 'N/A',
          amount: financialForm.value.amount,
          amountPaid: props.appointment.amountPaid,
          discount: financialForm.value.discount,
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
        noShowConfirmPending.value = false;
        noShowFeeMessage.value = '';
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
          case 5:
            // WP-42: no immediate transition — show the fee confirm step first.
            await requestNoShow();
            return;
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

    // WP-42: open the no-show confirm step and (best-effort) compute the fee line from the
    // session's site pct. Unreachable site / older API without the pct → generic line.
    const requestNoShow = async () => {
      if (!props.appointment) return;
      noShowFeeMessage.value = NOSHOW_GENERIC_MESSAGE;
      noShowConfirmPending.value = true;
      const amount = props.appointment.amount;
      const siteId = props.appointment.siteId;
      if (siteId) {
        try {
          const site = await sitesClient.getSite(siteId);
          const pct = site.noShowFeePct;
          if (typeof pct === 'number') {
            // Mirrors the API's round(pct% × gross, 2); display-only.
            const fee = Math.round(pct * amount) / 100;
            noShowFeeMessage.value =
              `A no-show fee of ${pct}% of $${amount.toFixed(2)} (= $${fee.toFixed(2)}) will be charged.`;
          }
        } catch {
          // Keep the generic line — the API applies the authoritative fee regardless.
        }
      }
    };

    const confirmNoShow = async () => {
      if (!props.appointment) return;
      actionInProgress.value = true;
      actionError.value = '';
      try {
        await client.noShowSession(props.appointment.sessionId);
        noShowConfirmPending.value = false;
        emit('updated');
        emit('close');
      } catch (e: unknown) {
        // WP-42 guard 400s (money moved / covering allocations) surface here verbatim.
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
      canEditDiscount, editSenadisActive, editSenadisFloor,
      canManageFees, carriesFee, hasWaivableLateFee, hasWaivableNoShowFee,
      showFeesSection, canWaiveFee, waiveModalVisible, onFeeWaived,
      showConfirmSection, showCancelSection, availableActions,
      isCompletedDiscovery, createPlanFromDiscovery, viewPatientPlans,
      startEditFinancials, saveFinancials,
      noShowConfirmPending, noShowFeeMessage, confirmNoShow,
      handleConfirm, handleStatusChange, handleCancel,
      hasClaim, Permissions,
    };
  },
});
</script>
