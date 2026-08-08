<template>
  <teleport to="body">
    <div v-if="visible && appointment" class="fixed inset-0 z-[60] flex items-center justify-center" data-testid="waive-fee-modal">
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>
      <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
        <div class="px-6 py-4 border-b border-slate-200">
          <h2 class="text-lg font-semibold text-slate-800">Waive Fee</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Session #{{ appointment.sessionId }} · {{ appointment.sessionDate }} · {{ appointment.patient }}
          </p>
        </div>

        <form @submit.prevent="submit">
          <div class="px-6 py-4 space-y-4">
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3" data-testid="waive-fee-error">
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>

            <!-- Only the kinds actually present are selectable. A session can carry both, which
                 is why the API requires an explicit kind instead of defaulting. -->
            <fieldset>
              <legend class="block text-sm font-medium text-slate-700 mb-2">Which fee?</legend>
              <div class="space-y-2">
                <label
                  class="flex items-start gap-2"
                  :class="hasLateFee ? '' : 'opacity-40 cursor-not-allowed'"
                >
                  <input
                    v-model="feeKind"
                    type="radio"
                    value="Late"
                    :disabled="!hasLateFee"
                    data-testid="waive-fee-kind-late"
                    class="mt-1 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm">
                    <span class="font-medium text-slate-800">Late chargeback</span>
                    <span v-if="hasLateFee" class="text-slate-600"> — {{ formatCurrency(lateFeeAmount) }}</span>
                    <span v-else class="text-slate-400"> — none on this session</span>
                  </span>
                </label>

                <label
                  class="flex items-start gap-2"
                  :class="hasNoShowFee ? '' : 'opacity-40 cursor-not-allowed'"
                >
                  <input
                    v-model="feeKind"
                    type="radio"
                    value="NoShow"
                    :disabled="!hasNoShowFee"
                    data-testid="waive-fee-kind-noshow"
                    class="mt-1 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm">
                    <span class="font-medium text-slate-800">No-show fee</span>
                    <span v-if="hasNoShowFee" class="text-slate-600"> — {{ formatCurrency(noShowFeeAmount) }}</span>
                    <span v-else class="text-slate-400"> — none on this session</span>
                  </span>
                </label>

                <label
                  class="flex items-start gap-2"
                  :class="hasLateFee && hasNoShowFee ? '' : 'opacity-40 cursor-not-allowed'"
                >
                  <input
                    v-model="feeKind"
                    type="radio"
                    value="Both"
                    :disabled="!(hasLateFee && hasNoShowFee)"
                    data-testid="waive-fee-kind-both"
                    class="mt-1 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-slate-800">Both</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Reason <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="reason"
                rows="3"
                maxlength="200"
                required
                data-testid="waive-fee-reason"
                placeholder="Why is this fee being forgiven?"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <p class="mt-1 text-[11px] text-slate-400">
                Recorded permanently on the session, with your name and today's date.
                {{ 200 - reason.length }} characters left.
              </p>
            </div>

            <!-- Showing the arithmetic before committing: waiving is not reversible through
                 this screen, and the original is only recoverable from the notes marker. -->
            <div class="bg-slate-50 rounded-lg p-3 text-sm" data-testid="waive-fee-preview">
              <div class="flex justify-between text-slate-600">
                <span>Amount due now</span>
                <span>{{ formatCurrency(appointment.amountDue) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Fee being waived</span>
                <span>− {{ formatCurrency(waivedTotal) }}</span>
              </div>
              <div class="flex justify-between font-semibold text-slate-800 border-t border-slate-200 mt-2 pt-2">
                <span>Amount due after</span>
                <span data-testid="waive-fee-after">{{ formatCurrency(amountDueAfter) }}</span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!canSubmit || submitting"
              data-testid="waive-fee-submit"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Waive Fee
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import type { Appointment } from '../../interfaces/Appointment';
import type { SessionFeeKind } from '../../interfaces/SessionFee';
import { formatCurrency } from '../../utils/formatCurrency';

export default defineComponent({
  name: 'WaiveFeeModal',
  props: {
    visible: { type: Boolean, default: false },
    appointment: { type: Object as PropType<Appointment | null>, default: null },
  },
  emits: ['close', 'waived'],
  setup(props, { emit }) {
    const client = new SessionsHttpClient();

    const feeKind = ref<SessionFeeKind | ''>('');
    const reason = ref('');
    const error = ref('');
    const submitting = ref(false);

    const lateFeeAmount = computed(() => props.appointment?.lateFeeAmount ?? 0);
    // A waived late fee is 0.00 with the marker still on file — nothing left to waive.
    const hasLateFee = computed(() => lateFeeAmount.value > 0);

    // The no-show fee lives in Amount (WP-42 wrote it there); waiving discounts it away, so
    // what remains waivable is amount − discount.
    const noShowFeeAmount = computed(() => {
      const a = props.appointment;
      if (!a) return 0;
      return Math.max(0, a.amount - a.discount);
    });
    const hasNoShowFee = computed(() =>
      (props.appointment?.notes?.includes('[NOSHOW-FEE') ?? false) && noShowFeeAmount.value > 0);

    const waivedTotal = computed(() => {
      if (feeKind.value === 'Late') return lateFeeAmount.value;
      if (feeKind.value === 'NoShow') return noShowFeeAmount.value;
      if (feeKind.value === 'Both') return lateFeeAmount.value + noShowFeeAmount.value;
      return 0;
    });

    const amountDueAfter = computed(() => (props.appointment?.amountDue ?? 0) - waivedTotal.value);

    const canSubmit = computed(() => !!feeKind.value && reason.value.trim().length > 0);

    // Preselect when only one kind is available — with two, the manager must choose.
    watch(() => props.visible, (isVisible) => {
      if (!isVisible) return;
      error.value = '';
      reason.value = '';
      if (hasLateFee.value && !hasNoShowFee.value) feeKind.value = 'Late';
      else if (hasNoShowFee.value && !hasLateFee.value) feeKind.value = 'NoShow';
      else feeKind.value = '';
    });

    const submit = async () => {
      if (!canSubmit.value || !props.appointment) return;
      submitting.value = true;
      error.value = '';
      try {
        const result = await client.waiveFee(props.appointment.sessionId, {
          feeKind: feeKind.value as SessionFeeKind,
          reason: reason.value.trim(),
        });
        emit('waived', result);
        emit('close');
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to waive the fee.';
      } finally {
        submitting.value = false;
      }
    };

    return {
      feeKind, reason, error, submitting,
      lateFeeAmount, hasLateFee, noShowFeeAmount, hasNoShowFee,
      waivedTotal, amountDueAfter, canSubmit,
      formatCurrency, submit,
    };
  },
});
</script>
