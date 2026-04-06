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
import { PatientsHttpClient } from '../services/PatientsHttpClient';
import { TreatmentPlansHttpClient } from '../services/TreatmentPlansHttpClient';
import type { TreatmentPlan } from '../interfaces/TreatmentPlan';

export default defineComponent({
  name: 'TreatmentPlansView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, TreatmentPlanList, TreatmentPlanFormModal },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const patientsClient = new PatientsHttpClient();
    const plansClient = new TreatmentPlansHttpClient();

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
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPlan = ref<TreatmentPlan | null>(null);

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

    onMounted(async () => {
      await Promise.all([loadPatient(), loadPlans()]);
      // Auto-open create form if query param is set
      if (route.query.create === 'true') {
        openCreate();
      }
    });

    // Re-load if patientId changes (query param navigation)
    watch(patientId, () => {
      loadPatient();
      loadPlans();
    });

    return {
      route,
      router,
      patientId,
      patientName,
      hasDiscovery,
      bookingLink,
      plans,
      loading,
      error,
      modalVisible,
      editingPlan,
      initialTab,
      openCreate,
      openEdit,
      onActivate,
      onComplete,
      onCancel,
      onSaved,
    };
  },
});
</script>
