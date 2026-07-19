<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end" data-testid="specialty-prices-modal">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-2xl bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">
              Prices — {{ specialty?.name }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Per-duration price sheet. New rows take effect on their date; history is never rewritten.
            </p>
          </div>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <!-- Loading / load error -->
          <p v-if="loading" class="text-sm text-slate-500 py-8 text-center">Loading prices...</p>
          <div v-else-if="loadError" class="py-8 text-center">
            <p class="text-sm text-red-600 mb-2" data-testid="specialty-prices-load-error">{{ loadError }}</p>
            <button class="text-sm text-violet-600 hover:text-violet-700 font-medium" @click="load">Try again</button>
          </div>

          <template v-else-if="history">
            <!-- G6: soft warning — no current-effective 60-min price (default session duration) -->
            <div
              v-if="missing60"
              class="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2"
              data-testid="specialty-prices-warning-60"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No current 60-minute price — the default session duration. Bookings will fall back to the
              Default $ (or no pre-fill).
            </div>

            <!-- Default $ fallback note -->
            <p class="mb-4 text-xs text-slate-500" data-testid="specialty-prices-default-note">
              <template v-if="history.defaultAmount != null">
                Durations without a current price fall back to Default $
                {{ formatAmount(history.defaultAmount) }}.
              </template>
              <template v-else>
                Durations without a current price have no fallback (no Default $ set).
              </template>
            </p>

            <!-- 5-duration grid -->
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th class="py-2 pr-3 w-20">Duration</th>
                  <th class="py-2 pr-3">Current price</th>
                  <th class="py-2 pr-3">New price ($)</th>
                  <th class="py-2 pr-3">Effective from</th>
                  <th class="py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="d in DURATIONS" :key="d">
                  <tr class="border-b border-slate-50" :data-testid="`specialty-prices-row-${d}`">
                    <td class="py-2.5 pr-3 text-sm font-medium text-slate-800">{{ d }} min</td>
                    <td class="py-2.5 pr-3 text-sm" :data-testid="`specialty-prices-current-${d}`">
                      <template v-if="currentFor(d)">
                        <span class="text-slate-800">$ {{ formatAmount(currentFor(d)!.amount) }}</span>
                        <span class="text-xs text-slate-400 ml-1.5">since {{ currentFor(d)!.effectiveFrom }}</span>
                      </template>
                      <span v-else class="text-slate-400" :title="history.defaultAmount != null ? `Falls back to Default $ ${formatAmount(history.defaultAmount)}` : 'No price and no Default $'">—</span>
                    </td>
                    <td class="py-2.5 pr-3">
                      <input
                        v-model="entries[d].amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="—"
                        :data-testid="`specialty-prices-amount-input-${d}`"
                        class="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </td>
                    <td class="py-2.5 pr-3">
                      <input
                        v-model="entries[d].effectiveFrom"
                        type="date"
                        :data-testid="`specialty-prices-date-input-${d}`"
                        class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </td>
                    <td class="py-2.5 text-right">
                      <button
                        v-if="historyFor(d).length > 0"
                        type="button"
                        class="text-xs text-violet-600 hover:text-violet-800 font-medium"
                        :data-testid="`specialty-prices-history-toggle-${d}`"
                        @click="toggleHistory(d)"
                      >
                        {{ expanded[d] ? 'Hide' : 'History' }}
                      </button>
                    </td>
                  </tr>
                  <!-- Expandable read-only history per duration (newest-first from the API) -->
                  <tr v-if="expanded[d]">
                    <td></td>
                    <td colspan="4" class="pb-3">
                      <ul class="text-xs space-y-1" :data-testid="`specialty-prices-history-${d}`">
                        <li
                          v-for="row in historyFor(d)"
                          :key="row.effectiveFrom"
                          class="flex items-center gap-2"
                          :class="row.isCurrent ? 'text-violet-700 font-medium' : 'text-slate-500'"
                        >
                          <span class="w-24">{{ row.effectiveFrom }}</span>
                          <span>$ {{ formatAmount(row.amount) }}</span>
                          <span
                            v-if="row.isCurrent"
                            class="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] uppercase tracking-wider"
                          >current</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>

            <p class="mt-3 text-xs text-slate-400">
              Future-dated rows schedule a price change; already-booked sessions keep their price.
            </p>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <FormErrorBanner :message="error" data-testid="specialty-prices-error" />
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="saving || hasError || !hasPendingRows"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              data-testid="specialty-prices-save"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save New Prices' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch, type PropType } from 'vue';
import type { LookupItem, SpecialtyPriceHistory, SpecialtyPriceHistoryRow, SpecialtyPriceAppendRow } from '../../interfaces/Lookups';
import { LookupHttpClient } from '../../services/LookupHttpClient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';

// WP-39 (G5): per-specialty price-sheet modal. Shows the current-effective price per duration
// (30/45/60/90/120), lets a Specialties.Prices.Edit holder APPEND effective-dated rows (default
// today; future dates allowed — temporal ruling), and exposes the read-only history per duration.
// History is never mutated: a correction is a new row effective today (or the intended date).

const DURATIONS = [30, 45, 60, 90, 120] as const;

function todayISO(): string {
  const d = new Date();
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default defineComponent({
  name: 'SpecialtyPricesModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    specialty: { type: Object as PropType<LookupItem | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const client = new LookupHttpClient();
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();

    const loading = ref(false);
    const loadError = ref('');
    const history = ref<SpecialtyPriceHistory | null>(null);

    // Per-duration new-price entry (amount blank = no new row for that duration).
    const entries = reactive<Record<number, { amount: string; effectiveFrom: string }>>({});
    const expanded = reactive<Record<number, boolean>>({});
    const resetEntries = () => {
      for (const d of DURATIONS) {
        entries[d] = { amount: '', effectiveFrom: todayISO() };
        expanded[d] = false;
      }
    };
    resetEntries();

    const load = async () => {
      if (!props.specialty) return;
      loading.value = true;
      loadError.value = '';
      history.value = null;
      try {
        history.value = await client.getSpecialtyPrices(props.specialty.id);
      } catch (e: unknown) {
        loadError.value = e instanceof Error ? e.message : 'Failed to load prices.';
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        resetEntries();
        load();
      }
    );

    const currentFor = (d: number): SpecialtyPriceHistoryRow | undefined =>
      history.value?.prices.find((p) => p.durationMinutes === d && p.isCurrent);

    const historyFor = (d: number): SpecialtyPriceHistoryRow[] =>
      history.value?.prices.filter((p) => p.durationMinutes === d) ?? [];

    // G6: soft warning when the specialty has no current-effective 60-min price (nothing blocking).
    const missing60 = computed(() => history.value !== null && !currentFor(60));

    const pendingRows = computed<SpecialtyPriceAppendRow[]>(() =>
      DURATIONS.filter((d) => String(entries[d].amount).trim() !== '').map((d) => ({
        durationMinutes: d,
        amount: Number(entries[d].amount),
        effectiveFrom: entries[d].effectiveFrom,
      }))
    );
    const hasPendingRows = computed(() => pendingRows.value.length > 0);

    const toggleHistory = (d: number) => { expanded[d] = !expanded[d]; };

    const formatAmount = (n: number) => n.toFixed(2);

    const handleSubmit = () => {
      if (!props.specialty) return;
      const rows = pendingRows.value;
      for (const row of rows) {
        if (Number.isNaN(row.amount) || row.amount < 0) {
          setError(`The ${row.durationMinutes}-minute price must be a number ≥ 0.`);
          return;
        }
        if (!row.effectiveFrom) {
          setError(`Pick an effective-from date for the ${row.durationMinutes}-minute price.`);
          return;
        }
      }
      const specialtyId = props.specialty.id;
      return submit(async () => {
        try {
          await client.putSpecialtyPrices(specialtyId, { prices: rows });
        } catch (e: unknown) {
          // The API answers 409 when a (duration, effective-from) row already exists. The base
          // client surfaces only the server's message, so match on it to say something friendly.
          if (e instanceof Error && /409|conflict|duplicate|already exists/i.test(e.message)) {
            throw new Error('A price for that duration and effective date already exists — pick a different date (history is never overwritten).');
          }
          throw e;
        }
        emit('saved');
        emit('close');
      });
    };

    return {
      DURATIONS,
      loading, loadError, history, entries, expanded,
      currentFor, historyFor, missing60, hasPendingRows,
      toggleHistory, formatAmount, load,
      error, hasError, saving, handleSubmit,
    };
  },
});
</script>
