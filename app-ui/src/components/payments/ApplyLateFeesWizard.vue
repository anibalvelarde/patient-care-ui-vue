<template>
  <div class="space-y-6" data-testid="late-fees-wizard">
    <!-- Two clocks on one screen is the main usability risk in this feature: staff already know
         "past due" as the 35-day rule, and this is a different, shorter one. Say so up front. -->
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4" data-testid="late-fees-banner">
      <p class="text-sm text-amber-900">
        <span class="font-semibold">Applies a {{ ratePct }}% late chargeback to sessions unpaid {{ graceDays + 1 }}+ days.</span>
        This is separate from the 35-day past-due rule — a session can carry a late fee long
        before it appears on the Past Due lists, and nothing here changes those lists.
      </p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">As of</label>
          <input
            v-model="asOf"
            type="date"
            data-testid="late-fees-asof"
            class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <button
            :disabled="loading"
            data-testid="late-fees-preview-btn"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="loadPreview"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Preview Late Fees
          </button>
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-2">
        Previewing charges nothing. Deselect any session you don't want charged — only the ones
        you leave checked are billed.
      </p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="late-fees-error">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- Result: applied AND skipped-with-reason. A manager who selected 12 and got 9 charged
         needs to know why the other 3 weren't. -->
    <div v-if="result" class="bg-white rounded-lg shadow-sm border border-slate-200" data-testid="late-fees-result">
      <div class="bg-green-50 border-b border-green-200 rounded-t-lg p-6">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-green-900">
              {{ formatCurrency(result.totalFeeApplied) }} charged across
              {{ result.appliedCount }} session{{ result.appliedCount !== 1 ? 's' : '' }}.
            </p>
            <button
              class="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              data-testid="late-fees-reset"
              @click="reset"
            >
              New Run
            </button>
          </div>
        </div>
      </div>

      <div v-if="result.skippedCount > 0" class="p-6" data-testid="late-fees-skipped">
        <h4 class="text-sm font-semibold text-slate-800 mb-2">
          {{ result.skippedCount }} session{{ result.skippedCount !== 1 ? 's were' : ' was' }} not charged
        </h4>
        <ul class="space-y-1">
          <li
            v-for="s in result.skipped"
            :key="s.sessionId"
            class="text-sm text-slate-600"
            data-testid="late-fees-skipped-row"
          >
            <span class="font-medium text-slate-700">#{{ s.sessionId }}</span> — {{ s.reason }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Preview table -->
    <template v-if="loaded && !result">
      <div
        v-if="preview.length === 0"
        class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center"
        data-testid="late-fees-empty"
      >
        <p class="text-sm text-slate-500">No sessions are eligible for a late fee as of this date.</p>
        <p class="text-xs text-slate-400 mt-1">Everything billed in the last {{ graceDays + 1 }} days is either paid or still inside the grace period.</p>
      </div>

      <div v-else class="bg-white rounded-lg shadow-sm border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-800">Sessions Eligible for a Late Fee</h3>
          <div class="flex items-center gap-3 text-sm">
            <button class="text-blue-600 hover:underline" data-testid="late-fees-select-all" @click="selectAll(true)">Select all</button>
            <button class="text-slate-500 hover:underline" data-testid="late-fees-clear" @click="selectAll(false)">Clear</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 w-10"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Session Date</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Days Unpaid</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Caretaker</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unpaid Balance</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Proposed Fee</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              <tr
                v-for="s in preview"
                :key="s.sessionId"
                class="hover:bg-slate-50"
                :class="selected[s.sessionId] ? '' : 'opacity-50'"
                data-testid="late-fees-row"
              >
                <td class="px-4 py-3">
                  <input
                    v-model="selected[s.sessionId]"
                    type="checkbox"
                    data-testid="late-fees-row-checkbox"
                    class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ s.sessionDate }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">{{ s.daysUnpaid }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ s.patientName }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{{ s.caretakerName || '—' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900">{{ formatCurrency(s.unpaidBalance) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-slate-900">{{ formatCurrency(s.proposedFee) }}</td>
              </tr>
              <tr class="bg-slate-50 font-medium">
                <td class="px-4 py-3" colspan="6">
                  <span class="text-sm text-slate-700" data-testid="late-fees-selected-count">
                    {{ selectedCount }} session{{ selectedCount !== 1 ? 's' : '' }} selected
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-900" data-testid="late-fees-total">
                  {{ formatCurrency(grandTotal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span class="text-sm text-slate-600">Total to charge</span>
            <span class="ml-2 text-2xl font-bold text-blue-700">{{ formatCurrency(grandTotal) }}</span>
          </div>
          <!-- House style: disable with a reason rather than hide, so a manager who lacks the
               claim learns why instead of wondering where the button went. -->
          <button
            :disabled="!canApply || submitting"
            :title="canApply ? '' : disabledReason"
            data-testid="late-fees-apply-btn"
            class="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="apply"
          >
            <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Apply Late Fees
          </button>
        </div>
        <p v-if="!canManageFees" class="px-6 pb-4 text-xs text-slate-400" data-testid="late-fees-no-claim-note">
          {{ disabledReason }}
        </p>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import type { LateFeePreviewItem, ApplyLateFeesResult } from '../../interfaces/SessionFee';
import { useClaims } from '../../composables/useClaims';
import { Permissions } from '../../generated/permissions';
import { toLocalYmd } from '../../utils/localDate';
import { formatCurrency } from '../../utils/formatCurrency';

export default defineComponent({
  name: 'ApplyLateFeesWizard',
  emits: ['completed'],
  setup(_props, { emit }) {
    const client = new SessionsHttpClient();
    const { hasClaim } = useClaims();

    const asOf = ref(toLocalYmd(new Date()));
    const preview = ref<LateFeePreviewItem[]>([]);
    const selected = reactive<Record<number, boolean>>({});
    const loaded = ref(false);
    const loading = ref(false);
    const submitting = ref(false);
    const error = ref('');
    const result = ref<ApplyLateFeesResult | null>(null);

    // Server-authoritative, but seeded so the banner reads correctly before the first preview.
    const ratePct = ref(30);
    const graceDays = ref(6);

    const canManageFees = computed(() => hasClaim('Permission', Permissions.SessionsFeeManage));
    const selectedSessions = computed(() => preview.value.filter((s) => selected[s.sessionId]));
    const selectedCount = computed(() => selectedSessions.value.length);
    const grandTotal = computed(() => selectedSessions.value.reduce((sum, s) => sum + s.proposedFee, 0));
    const canApply = computed(() => canManageFees.value && selectedCount.value > 0);

    const disabledReason = computed(() => {
      if (!canManageFees.value) return 'Applying late fees is a manager action — you can review this list but not charge it.';
      if (selectedCount.value === 0) return 'Select at least one session to charge.';
      return '';
    });

    const selectAll = (value: boolean) => {
      preview.value.forEach((s) => { selected[s.sessionId] = value; });
    };

    const loadPreview = async () => {
      loading.value = true;
      error.value = '';
      result.value = null;
      try {
        const res = await client.previewLateFees(asOf.value);
        preview.value = res.items;
        ratePct.value = res.ratePct;
        graceDays.value = res.graceDays;
        Object.keys(selected).forEach((k) => delete selected[Number(k)]);
        res.items.forEach((s) => { selected[s.sessionId] = true; });
        loaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load the late-fee preview.';
      } finally {
        loading.value = false;
      }
    };

    const apply = async () => {
      if (!canApply.value) return;
      submitting.value = true;
      error.value = '';
      try {
        result.value = await client.applyLateFees({
          sessionIds: selectedSessions.value.map((s) => s.sessionId),
          asOf: asOf.value,
        });
        loaded.value = false;
        preview.value = [];
        emit('completed', result.value);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to apply late fees.';
      } finally {
        submitting.value = false;
      }
    };

    const reset = () => {
      result.value = null;
      error.value = '';
    };

    return {
      asOf, preview, selected, loaded, loading, submitting, error, result,
      ratePct, graceDays, canManageFees, selectedCount, grandTotal, canApply, disabledReason,
      formatCurrency, selectAll, loadPreview, apply, reset,
    };
  },
});
</script>
