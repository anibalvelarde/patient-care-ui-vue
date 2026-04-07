<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="handleClose"></div>
      <div class="relative w-full max-w-3xl bg-white shadow-xl flex flex-col h-full">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <h2 class="text-lg font-semibold text-slate-800">Schedule Sessions</h2>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
              Step {{ step }} of 3
            </span>
          </div>
          <button @click="handleClose" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-4">

          <!-- Step 1: Start Date + Site -->
          <div v-if="step === 1" class="space-y-6">
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-sm text-slate-600 mb-1">
                Plan #{{ plan?.id }} &middot; {{ plan?.patientName }}
              </p>
              <p class="text-sm text-slate-500">
                {{ plan?.weeklyFrequency }}x/week &middot; {{ plan?.durationWeeks }} weeks &middot; {{ plan?.lines.length }} line(s)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                v-model="startDate"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p class="text-xs text-slate-400 mt-1">Sessions will be scheduled starting from this date.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Site</label>
              <select
                v-model.number="siteId"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option :value="0" disabled>Select a site...</option>
                <option v-for="site in sites" :key="site.id" :value="site.id">
                  {{ site.siteName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Step 2: Review/Override Lines -->
          <div v-if="step === 2" class="space-y-4">
            <p class="text-sm text-slate-600">Review and adjust each treatment line before scheduling.</p>

            <div
              v-for="(line, idx) in lineEdits"
              :key="line.lineId"
              class="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-slate-800">
                  Line {{ idx + 1 }}: {{ line.specialtyAbbreviation }}
                </span>
                <span class="text-xs text-slate-400">{{ line.duration }} min</span>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Therapist</label>
                  <select
                    v-model.number="line.therapistId"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                  >
                    <option :value="0">Any Qualified</option>
                    <option v-for="t in therapists" :key="t.id" :value="t.id">
                      {{ t.therapistName }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Day</label>
                  <select
                    v-model.number="line.dayOfWeek"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                  >
                    <option :value="0">Flexible</option>
                    <option v-for="(label, day) in dayLabels" :key="day" :value="Number(day)">{{ label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Time</label>
                  <input
                    type="time"
                    v-model="line.time"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">Discount</label>
                  <div class="flex items-center space-x-2">
                    <div class="relative flex-1">
                      <span class="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        v-model.number="line.discountAmount"
                        @input="updateDiscountPct(line)"
                        class="w-full pl-5 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <span class="text-xs text-slate-400">=</span>
                    <div class="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        v-model.number="line.discountPct"
                        @input="updateDiscountAmt(line)"
                        class="w-full pl-2 pr-5 py-1.5 border border-slate-200 rounded-lg text-sm"
                      />
                      <span class="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">
                    Amount: ${{ lineAmount(line).toFixed(2) }}
                    <template v-if="line.discountAmount > 0">
                      &rarr; Net: ${{ (lineAmount(line) - line.discountAmount).toFixed(2) }}
                    </template>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Results -->
          <div v-if="step === 3" class="space-y-4">
            <!-- Summary banner -->
            <div :class="[
              'rounded-xl p-4',
              result && result.conflicts.length > 0
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-emerald-50 border border-emerald-200',
            ]">
              <p class="text-sm font-semibold" :class="result && result.conflicts.length > 0 ? 'text-amber-800' : 'text-emerald-800'">
                {{ result?.sessionsCreated }} session{{ result?.sessionsCreated !== 1 ? 's' : '' }} created
                <template v-if="result && result.conflicts.length > 0">
                  &middot; {{ result.conflicts.length }} conflict{{ result.conflicts.length !== 1 ? 's' : '' }}
                </template>
              </p>
            </div>

            <!-- Created sessions grouped by week -->
            <div v-if="result && result.sessions.length > 0">
              <h3 class="text-sm font-semibold text-slate-700 mb-2">Scheduled Sessions</h3>
              <div v-for="week in sessionsByWeek" :key="week.weekNumber" class="mb-3">
                <p class="text-xs font-medium text-slate-500 mb-1">Week {{ week.weekNumber }}</p>
                <div class="space-y-1">
                  <div
                    v-for="s in week.sessions"
                    :key="s.sessionId"
                    class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <div class="flex items-center space-x-3">
                      <span class="text-slate-600">{{ formatDate(s.sessionDate) }}</span>
                      <span class="text-slate-400">{{ s.sessionTime }}</span>
                      <span class="font-medium text-violet-600">{{ s.specialtyAbbreviation }}</span>
                      <span class="text-slate-600">{{ s.therapistName }}</span>
                    </div>
                    <div class="text-right text-xs text-slate-500">
                      ${{ s.amount.toFixed(2) }}
                      <span v-if="s.discountAmount > 0" class="text-amber-600">
                        (-${{ s.discountAmount.toFixed(2) }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Conflicts -->
            <div v-if="result && result.conflicts.length > 0">
              <h3 class="text-sm font-semibold text-amber-700 mb-2">Conflicts</h3>
              <div class="space-y-2">
                <div
                  v-for="(conflict, ci) in result.conflicts"
                  :key="ci"
                  class="bg-amber-50 rounded-lg px-3 py-2"
                >
                  <p class="text-sm text-amber-800">
                    Week {{ conflict.weekNumber }} &middot; {{ formatDate(conflict.date) }}: {{ conflict.reason }}
                  </p>
                  <div v-if="conflict.suggestedAlternatives.length > 0" class="mt-1 ml-4 space-y-1">
                    <p v-for="(alt, ai) in conflict.suggestedAlternatives" :key="ai" class="text-xs text-amber-600">
                      <template v-if="alt.type === 'different-therapist'">
                        Try {{ alt.therapistName }} at {{ alt.time }}
                      </template>
                      <template v-else>
                        Try {{ alt.therapistName }} at {{ alt.time }}
                      </template>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            <button
              v-if="step > 1 && step < 3"
              @click="step--"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
          </div>
          <div class="flex space-x-3">
            <button
              @click="handleClose"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {{ step === 3 ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="step === 1"
              :disabled="!canProceedStep1"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                canProceedStep1
                  ? 'text-white bg-violet-600 hover:bg-violet-700'
                  : 'text-white bg-violet-300 cursor-not-allowed',
              ]"
              @click="step = 2"
            >
              Next
            </button>
            <button
              v-if="step === 2"
              :disabled="submitting"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:bg-violet-300"
              @click="submitSchedule"
            >
              {{ submitting ? 'Scheduling...' : 'Schedule Sessions' }}
            </button>
          </div>
        </div>

        <!-- Error footer -->
        <div v-if="errorMsg" class="px-6 py-3 bg-red-50 border-t border-red-200">
          <p class="text-sm text-red-700">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, type PropType } from 'vue';
import type { TreatmentPlan, BulkScheduleResult, LineOverride } from '../../interfaces/TreatmentPlan';
import { DAY_OF_WEEK_LABELS } from '../../interfaces/TreatmentPlan';
import { TreatmentPlansHttpClient } from '../../services/TreatmentPlansHttpClient';
import { SitesHttpClient } from '../../services/SitesHttpClient';
import { TherapistsHttpClient } from '../../services/TherapistsHttpClient';
import type { Site } from '../../interfaces/Site';
import type { Therapist } from '../../interfaces/Therapist';

interface LineEdit {
  lineId: number;
  specialtyAbbreviation: string;
  duration: number;
  therapistId: number;
  dayOfWeek: number;
  time: string;
  discountAmount: number;
  discountPct: number;
}

const HOURLY_RATE = 65;

export default defineComponent({
  name: 'SchedulePlanWizard',
  props: {
    visible: { type: Boolean, default: false },
    plan: { type: Object as PropType<TreatmentPlan | null>, default: null },
  },
  emits: ['close', 'scheduled'],
  setup(props, { emit }) {
    const plansClient = new TreatmentPlansHttpClient();
    const sitesClient = new SitesHttpClient();
    const therapistsClient = new TherapistsHttpClient();

    const step = ref(1);
    const startDate = ref('');
    const siteId = ref(0);
    const sites = ref<Array<{ id: number; siteName: string }>>([]);
    const therapists = ref<Array<{ id: number; therapistName: string }>>([]);
    const lineEdits = ref<LineEdit[]>([]);
    const submitting = ref(false);
    const errorMsg = ref('');
    const result = ref<BulkScheduleResult | null>(null);
    const dayLabels = DAY_OF_WEEK_LABELS;

    const canProceedStep1 = computed(() => startDate.value !== '' && siteId.value > 0);

    const lineAmount = (line: LineEdit) => {
      return Math.round(HOURLY_RATE * line.duration / 60 * 100) / 100;
    };

    const updateDiscountPct = (line: LineEdit) => {
      const amt = lineAmount(line);
      line.discountPct = amt > 0 ? Math.round(line.discountAmount / amt * 10000) / 100 : 0;
    };

    const updateDiscountAmt = (line: LineEdit) => {
      const amt = lineAmount(line);
      line.discountAmount = Math.round(amt * line.discountPct / 100 * 100) / 100;
    };

    const sessionsByWeek = computed(() => {
      if (!result.value) return [];
      const grouped = new Map<number, typeof result.value.sessions>();
      for (const s of result.value.sessions) {
        if (!grouped.has(s.weekNumber)) grouped.set(s.weekNumber, []);
        grouped.get(s.weekNumber)!.push(s);
      }
      return Array.from(grouped.entries())
        .sort(([a], [b]) => a - b)
        .map(([weekNumber, sessions]) => ({ weekNumber, sessions }));
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getNextMonday = () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    };

    const initForm = () => {
      step.value = 1;
      startDate.value = getNextMonday();
      siteId.value = 0;
      errorMsg.value = '';
      result.value = null;
      submitting.value = false;

      if (props.plan) {
        lineEdits.value = props.plan.lines.map(l => ({
          lineId: l.id,
          specialtyAbbreviation: l.specialtyAbbreviation,
          duration: l.duration,
          therapistId: l.preferredTherapistId ?? 0,
          dayOfWeek: l.dayOfWeek ?? 0,
          time: l.preferredTime ?? '09:00',
          discountAmount: 0,
          discountPct: 0,
        }));
      }
    };

    const loadDropdowns = async () => {
      try {
        const [siteList, therapistList] = await Promise.all([
          sitesClient.getSites(),
          therapistsClient.getTherapists(),
        ]);
        sites.value = siteList.map((s: Site) => ({
          id: s.siteId,
          siteName: s.siteName,
        }));
        therapists.value = therapistList.map((t: Therapist) => ({
          id: t.therapistId,
          therapistName: t.therapistName,
        }));
      } catch {
        // Non-fatal; dropdowns will be empty
      }
    };

    const submitSchedule = async () => {
      if (!props.plan) return;
      submitting.value = true;
      errorMsg.value = '';

      const overrides: LineOverride[] = lineEdits.value.map(le => ({
        treatmentPlanLineId: le.lineId,
        therapistId: le.therapistId > 0 ? le.therapistId : null,
        dayOfWeek: le.dayOfWeek > 0 ? le.dayOfWeek : null,
        time: le.time || null,
        discountAmount: le.discountAmount > 0 ? le.discountAmount : null,
      }));

      try {
        result.value = await plansClient.schedule(props.plan.id, {
          startDate: startDate.value,
          siteId: siteId.value,
          lineOverrides: overrides,
        });
        step.value = 3;
      } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to schedule sessions.';
      } finally {
        submitting.value = false;
      }
    };

    const handleClose = () => {
      if (step.value === 3 && result.value) {
        emit('scheduled', result.value);
      }
      emit('close');
    };

    watch(() => props.visible, (val) => {
      if (val) {
        initForm();
        loadDropdowns();
      }
    });

    return {
      step,
      startDate,
      siteId,
      sites,
      therapists,
      lineEdits,
      submitting,
      errorMsg,
      result,
      dayLabels,
      canProceedStep1,
      lineAmount,
      updateDiscountPct,
      updateDiscountAmt,
      sessionsByWeek,
      formatDate,
      submitSchedule,
      handleClose,
    };
  },
});
</script>
