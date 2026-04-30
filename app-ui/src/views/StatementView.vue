<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav class="print:hidden" />
    <div class="flex flex-1">
      <O2Sidebar class="print:hidden" />
      <div class="flex-1 flex flex-col">
        <O2Header class="print:hidden" />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div class="mb-6 print:hidden">
            <h1 class="text-2xl font-bold text-slate-800">Statements</h1>
            <p class="text-sm text-slate-500 mt-1">Generate account statements for caretakers and therapists</p>
          </div>

          <!-- Tab bar (hidden in print) -->
          <div class="mb-6 print:hidden border-b border-slate-200">
            <nav class="-mb-px flex gap-6" aria-label="Statement tabs">
              <button
                type="button"
                class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
                :class="activeTab === 'caretaker'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                @click="setTab('caretaker')"
              >
                Caretaker
              </button>
              <button
                type="button"
                class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
                :class="activeTab === 'therapist'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                @click="setTab('therapist')"
              >
                Therapist
              </button>
            </nav>
          </div>

          <!-- Caretaker Tab -->
          <div v-show="activeTab === 'caretaker'">
            <!-- Selection controls (hidden when statement is displayed) -->
            <div v-if="!caretakerStatement && !caretakerLoading" class="mb-6">
              <CaretakerStatementControls
                :caretakers="caretakers"
                :loading="caretakerLoading"
                @generate="onCaretakerGenerate"
              />
            </div>

            <!-- Back bar -->
            <div v-if="(caretakerStatement || caretakerLoading) && !caretakerError" class="mb-6 print:hidden">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span v-if="caretakerStatement" class="text-sm text-slate-600">
                    Viewing statement for <span class="font-semibold text-slate-900">{{ caretakerStatement.caretakerName }}</span>
                  </span>
                  <span v-else class="text-sm text-slate-500">Generating statement...</span>
                </div>
                <button
                  class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                  @click="onCaretakerBack"
                >
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            </div>

            <div v-if="caretakerLoading" class="px-6 py-12 text-center text-sm text-slate-400">
              <svg class="animate-spin mx-auto h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating statement...
            </div>

            <div v-if="caretakerError" class="mb-6">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm text-red-700">{{ caretakerError }}</p>
              </div>
              <button
                class="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                @click="onCaretakerBack"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <CaretakerStatementScreen v-if="caretakerStatement && !caretakerLoading" :statement="caretakerStatement" />
          </div>

          <!-- Therapist Tab -->
          <div v-show="activeTab === 'therapist'">
            <div v-if="!therapistStatement && !therapistLoading" class="mb-6">
              <TherapistStatementControls
                :therapists="therapists"
                :loading="therapistLoading"
                @generate="onTherapistGenerate"
              />
            </div>

            <div v-if="(therapistStatement || therapistLoading) && !therapistError" class="mb-6 print:hidden">
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span v-if="therapistStatement" class="text-sm text-slate-600">
                    Viewing statement for <span class="font-semibold text-slate-900">{{ therapistStatement.therapistName }}</span>
                  </span>
                  <span v-else class="text-sm text-slate-500">Generating statement...</span>
                </div>
                <button
                  class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                  @click="onTherapistBack"
                >
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            </div>

            <div v-if="therapistLoading" class="px-6 py-12 text-center text-sm text-slate-400">
              <svg class="animate-spin mx-auto h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating statement...
            </div>

            <div v-if="therapistError" class="mb-6">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm text-red-700">{{ therapistError }}</p>
              </div>
              <button
                class="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                @click="onTherapistBack"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <TherapistStatementScreen v-if="therapistStatement && !therapistLoading" :statement="therapistStatement" />
          </div>
        </main>
        <O2Footer class="print:hidden" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import CaretakerStatementControls from '../components/statements/CaretakerStatementControls.vue';
import CaretakerStatementScreen from '../components/statements/CaretakerStatementScreen.vue';
import TherapistStatementControls from '../components/statements/TherapistStatementControls.vue';
import TherapistStatementScreen from '../components/statements/TherapistStatementScreen.vue';
import { CaretakersHttpClient } from '../services/CaretakersHttpClient';
import { TherapistsHttpClient } from '../services/TherapistsHttpClient';
import { StatementsHttpClient } from '../services/StatementsHttpClient';
import type { AccountStatement } from '../interfaces/Statement';
import type { TherapistStatement } from '../interfaces/TherapistStatement';

interface CaretakerOption {
  caretakerId: number
  caretakerName: string
}

interface TherapistOption {
  therapistId: number
  therapistName: string
}

type TabKey = 'caretaker' | 'therapist';

export default defineComponent({
  name: 'StatementView',
  components: {
    O2MobileNav,
    O2Sidebar,
    O2Header,
    O2Footer,
    CaretakerStatementControls,
    CaretakerStatementScreen,
    TherapistStatementControls,
    TherapistStatementScreen,
  },
  setup() {
    const caretakersClient = new CaretakersHttpClient();
    const therapistsClient = new TherapistsHttpClient();
    const statementsClient = new StatementsHttpClient();

    // Tab state — Caretaker is the default
    const activeTab = ref<TabKey>('caretaker');
    const setTab = (tab: TabKey) => {
      activeTab.value = tab;
    };

    // Caretaker tab state (preserves the original flow verbatim)
    const caretakers = ref<CaretakerOption[]>([]);
    const caretakerStatement = ref<AccountStatement | null>(null);
    const caretakerLoading = ref(false);
    const caretakerError = ref('');

    // Therapist tab state
    const therapists = ref<TherapistOption[]>([]);
    const therapistStatement = ref<TherapistStatement | null>(null);
    const therapistLoading = ref(false);
    const therapistError = ref('');

    const loadCaretakers = async () => {
      try {
        const list = await caretakersClient.getCaretakers();
        caretakers.value = list
          .map((c) => ({
            caretakerId: c.caretakerId,
            caretakerName: c.caretakerName,
          }))
          .sort((a, b) => a.caretakerName.localeCompare(b.caretakerName));
      } catch (e: unknown) {
        caretakerError.value = e instanceof Error ? e.message : 'Failed to load caretakers.';
      }
    };

    const loadTherapists = async () => {
      try {
        const list = await therapistsClient.getTherapists();
        therapists.value = list
          .map((t) => ({
            therapistId: t.therapistId,
            therapistName: t.therapistName,
          }))
          .sort((a, b) => a.therapistName.localeCompare(b.therapistName));
      } catch (e: unknown) {
        therapistError.value = e instanceof Error ? e.message : 'Failed to load therapists.';
      }
    };

    const onCaretakerGenerate = async (caretakerId: number, from: string, to: string) => {
      caretakerLoading.value = true;
      caretakerError.value = '';
      caretakerStatement.value = null;
      try {
        caretakerStatement.value = await statementsClient.getStatement(caretakerId, from, to);
      } catch (e: unknown) {
        caretakerError.value = e instanceof Error ? e.message : 'Failed to generate statement.';
      } finally {
        caretakerLoading.value = false;
      }
    };

    const onCaretakerBack = () => {
      caretakerStatement.value = null;
      caretakerError.value = '';
      caretakerLoading.value = false;
    };

    const onTherapistGenerate = async (therapistId: number, from: string, to: string) => {
      therapistLoading.value = true;
      therapistError.value = '';
      therapistStatement.value = null;
      try {
        therapistStatement.value = await statementsClient.getTherapistStatement(therapistId, from, to);
      } catch (e: unknown) {
        therapistError.value = e instanceof Error ? e.message : 'Failed to generate statement.';
      } finally {
        therapistLoading.value = false;
      }
    };

    const onTherapistBack = () => {
      therapistStatement.value = null;
      therapistError.value = '';
      therapistLoading.value = false;
    };

    onMounted(() => {
      loadCaretakers();
      loadTherapists();
    });

    return {
      activeTab,
      setTab,
      caretakers,
      caretakerStatement,
      caretakerLoading,
      caretakerError,
      onCaretakerGenerate,
      onCaretakerBack,
      therapists,
      therapistStatement,
      therapistLoading,
      therapistError,
      onTherapistGenerate,
      onTherapistBack,
    };
  },
});
</script>
