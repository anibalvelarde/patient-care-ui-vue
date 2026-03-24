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
            <p class="text-sm text-slate-500 mt-1">Generate account statements for caretakers</p>
          </div>

          <!-- Selection controls (hidden when statement is displayed) -->
          <div v-if="!statement && !loading" class="mb-6">
            <StatementControls
              :caretakers="caretakers"
              :loading="loading"
              @generate="onGenerate"
            />
          </div>

          <!-- Back bar (shown when statement is displayed) -->
          <div v-if="(statement || loading) && !error" class="mb-6 print:hidden">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span v-if="statement" class="text-sm text-slate-600">
                  Viewing statement for <span class="font-semibold text-slate-900">{{ statement.caretakerName }}</span>
                </span>
                <span v-else class="text-sm text-slate-500">Generating statement...</span>
              </div>
              <button
                class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                @click="onBack"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">
            <svg class="animate-spin mx-auto h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating statement...
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
            <button
              class="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
              @click="onBack"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>

          <!-- Statement -->
          <StatementScreen v-if="statement && !loading" :statement="statement" />
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
import StatementControls from '../components/statements/StatementControls.vue';
import StatementScreen from '../components/statements/StatementScreen.vue';
import { CaretakersHttpClient } from '../services/CaretakersHttpClient';
import { StatementsHttpClient } from '../services/StatementsHttpClient';
import type { AccountStatement } from '../interfaces/Statement';

interface CaretakerOption {
  caretakerId: number
  caretakerName: string
}

export default defineComponent({
  name: 'StatementView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, StatementControls, StatementScreen },
  setup() {
    const caretakersClient = new CaretakersHttpClient();
    const statementsClient = new StatementsHttpClient();

    const caretakers = ref<CaretakerOption[]>([]);
    const statement = ref<AccountStatement | null>(null);
    const loading = ref(false);
    const error = ref('');

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
        error.value = e instanceof Error ? e.message : 'Failed to load caretakers.';
      }
    };

    const onGenerate = async (caretakerId: number, from: string, to: string) => {
      loading.value = true;
      error.value = '';
      statement.value = null;
      try {
        statement.value = await statementsClient.getStatement(caretakerId, from, to);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to generate statement.';
      } finally {
        loading.value = false;
      }
    };

    const onBack = () => {
      statement.value = null;
      error.value = '';
      loading.value = false;
    };

    onMounted(loadCaretakers);

    return { caretakers, statement, loading, error, onGenerate, onBack };
  },
});
</script>
