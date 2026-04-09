<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col min-h-screen">
        <O2Header />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <!-- No patientId error -->
          <div v-if="!patientId" class="bg-red-50 rounded-xl p-6 text-center">
            <p class="text-sm text-red-700">No patient selected.</p>
            <router-link to="/patients" class="mt-2 inline-block text-sm font-medium text-red-600 hover:text-red-800">
              Back to Patients
            </router-link>
          </div>

          <template v-else>
            <!-- Header -->
            <div class="mb-6">
              <button @click="router.push('/patients')" class="text-sm text-violet-600 hover:text-violet-700 mb-2 inline-flex items-center">
                &larr; Back to Patients
              </button>
              <h1 class="text-2xl font-bold text-slate-800">Treatment Plans</h1>
              <p class="text-sm text-slate-500 mt-1">{{ patientName }}</p>
            </div>

            <!-- Discovery-first guidance -->
            <div v-if="hasDiscovery === false" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm text-amber-800 font-medium">This patient needs a discovery session first.</p>
                  <p class="text-xs text-amber-600 mt-1">Book a discovery session from the
                    <router-link :to="bookingLink" class="underline hover:text-amber-800">Appointments page</router-link>
                    before creating a treatment plan.
                  </p>
                </div>
              </div>
            </div>

            <!-- Discovery Sessions Summary -->
            <div v-if="discoverySessions.length > 0" class="bg-white border border-slate-200 rounded-xl p-4 mb-6">
              <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <svg class="w-4 h-4 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Discovery Sessions
              </h3>
              <div class="space-y-2">
                <div
                  v-for="ds in discoverySessions"
                  :key="ds.sessionId"
                  class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center space-x-3 text-sm">
                    <span class="font-medium text-slate-700">#{{ ds.sessionId }}</span>
                    <span class="text-violet-600 font-medium">{{ ds.specialtyAbbreviation }}</span>
                    <span class="text-slate-500">{{ formatDiscoveryDate(ds.sessionDate) }}</span>
                    <span class="text-slate-500">with {{ ds.therapistName }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Plans Needing Attention -->
            <div v-if="attentionPlans.length > 0" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <h3 class="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                <svg class="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Plans Needing Attention
              </h3>
              <div class="space-y-2">
                <div
                  v-for="ap in attentionPlans"
                  :key="ap.planId"
                  class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100"
                >
                  <div class="text-sm">
                    <span class="font-medium text-slate-700">{{ ap.patientName }}</span>
                    <span class="text-slate-400 mx-1">&middot;</span>
                    <span class="text-slate-500">{{ ap.displayTitle }}</span>
                    <span class="text-slate-400 mx-1">&middot;</span>
                    <span class="text-amber-700 font-medium">No remaining sessions scheduled</span>
                  </div>
                  <button
                    @click="goToSchedulePlan(ap)"
                    class="text-xs font-medium text-violet-600 hover:text-violet-800 whitespace-nowrap ml-3"
                  >
                    Schedule Sessions &rarr;
                  </button>
                </div>
              </div>
            </div>

            <TreatmentPlanList
              :plans="plans"
              :loading="loading"
              :error="error"
              :initial-tab="initialTab"
              :can-create="hasDiscovery !== false"
              @create="openCreate"
              @edit="openEdit"
              @activate="onActivate"
              @complete="onComplete"
              @cancel="onCancel"
              @schedule="onSchedule"
            />
          </template>
        </main>
        <O2Footer />
      </div>
    </div>

    <TreatmentPlanFormModal
      :visible="modalVisible"
      :plan="editingPlan"
      :patient-id="patientId"
      :patient-name="patientName"
      :discovery-session-id="Number(route.query.discoverySessionId) || 0"
      @close="modalVisible = false"
      @saved="onSaved"
    />

    <SchedulePlanWizard
      :visible="scheduleWizardVisible"
      :plan="schedulingPlan"
      @close="scheduleWizardVisible = false"
      @scheduled="onScheduled"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import TreatmentPlanList from '../components/treatment-plans/TreatmentPlanList.vue';
import TreatmentPlanFormModal from '../components/treatment-plans/TreatmentPlanFormModal.vue';
import SchedulePlanWizard from '../components/treatment-plans/SchedulePlanWizard.vue';
import { PatientsHttpClient } from '../services/PatientsHttpClient';
import { TreatmentPlansHttpClient } from '../services/TreatmentPlansHttpClient';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import type { TreatmentPlan, DiscoverySessionSummary, ActivePlanSummary } from '../interfaces/TreatmentPlan';

export default defineComponent({
  name: 'TreatmentPlansView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, TreatmentPlanList, TreatmentPlanFormModal, SchedulePlanWizard },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const patientsClient = new PatientsHttpClient();
    const plansClient = new TreatmentPlansHttpClient();
    const sessionsClient = new SessionsHttpClient();

    const patientId = computed(() => {
      const raw = route.query.patientId;
      const parsed = Number(raw);
      return parsed > 0 ? parsed : 0;
    });

    const initialTab = computed(() => {
      const tab = route.query.tab as string | undefined;
      const validTabs = ['All', 'Draft', 'Active', 'Completed', 'Cancelled'];
      return tab && validTabs.includes(tab) ? tab : 'All';
    });

    const patientName = ref('');
    const bookingLink = computed(() => ({
      path: '/appointments',
      query: { bookFor: String(patientId.value) },
    }));
    const hasDiscovery = ref<boolean | null>(null);
    const plans = ref<TreatmentPlan[]>([]);
    const discoverySessions = ref<DiscoverySessionSummary[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPlan = ref<TreatmentPlan | null>(null);
    const scheduleWizardVisible = ref(false);
    const schedulingPlan = ref<TreatmentPlan | null>(null);
    const activeSummaries = ref<ActivePlanSummary[]>([]);
    const attentionPlans = computed(() => activeSummaries.value.filter(s => s.needsAttention));

    const loadPatient = async () => {
      if (!patientId.value) return;
      try {
        const patient = await patientsClient.getPatient(patientId.value);
        patientName.value = patient.patientName;
        hasDiscovery.value = patient.hasCompletedDiscovery ?? null;
      } catch {
        patientName.value = 'Unknown Patient';
      }
    };

    const loadPlans = async () => {
      if (!patientId.value) return;
      loading.value = true;
      error.value = '';
      try {
        plans.value = await plansClient.getByPatient(patientId.value);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load treatment plans.';
      } finally {
        loading.value = false;
      }
    };

    const loadActiveSummary = async () => {
      try {
        activeSummaries.value = await plansClient.getActiveSummary();
      } catch {
        activeSummaries.value = [];
      }
    };

    const loadDiscoverySessions = async () => {
      if (!patientId.value) return;
      try {
        discoverySessions.value = await sessionsClient.getDiscoverySessions(patientId.value);
      } catch {
        discoverySessions.value = [];
      }
    };

    const formatDiscoveryDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const openCreate = () => {
      editingPlan.value = null;
      modalVisible.value = true;
    };

    const openEdit = (plan: TreatmentPlan) => {
      editingPlan.value = plan;
      modalVisible.value = true;
    };

    const onActivate = async (plan: TreatmentPlan) => {
      try {
        await plansClient.activate(plan.id);
        await loadPlans();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to activate plan.';
      }
    };

    const onComplete = async (plan: TreatmentPlan) => {
      try {
        await plansClient.complete(plan.id);
        await loadPlans();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to complete plan.';
      }
    };

    const onCancel = async (plan: TreatmentPlan) => {
      try {
        await plansClient.cancel(plan.id);
        await loadPlans();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to cancel plan.';
      }
    };

    const onSaved = () => {
      loadPlans();
    };

    const onSchedule = (plan: TreatmentPlan) => {
      schedulingPlan.value = plan;
      scheduleWizardVisible.value = true;
    };

    const onScheduled = () => {
      loadPlans();
      loadActiveSummary();
    };

    const goToSchedulePlan = (summary: ActivePlanSummary) => {
      router.push({
        path: '/treatment-plans',
        query: { patientId: String(summary.patientId), tab: 'Active' },
      });
    };

    onMounted(async () => {
      await Promise.all([loadPatient(), loadPlans(), loadDiscoverySessions(), loadActiveSummary()]);
      // Auto-open create form if query param is set
      if (route.query.create === 'true') {
        openCreate();
      }
    });

    // Re-load if patientId changes (query param navigation)
    watch(patientId, () => {
      loadPatient();
      loadPlans();
      loadDiscoverySessions();
    });

    return {
      route,
      router,
      patientId,
      patientName,
      hasDiscovery,
      bookingLink,
      discoverySessions,
      plans,
      loading,
      error,
      modalVisible,
      editingPlan,
      initialTab,
      formatDiscoveryDate,
      openCreate,
      openEdit,
      onActivate,
      onComplete,
      onCancel,
      onSaved,
      scheduleWizardVisible,
      schedulingPlan,
      onSchedule,
      onScheduled,
      attentionPlans,
      goToSchedulePlan,
    };
  },
});
</script>
