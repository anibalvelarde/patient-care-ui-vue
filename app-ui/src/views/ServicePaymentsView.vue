<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
        <O2Header />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-slate-800">Service Payments</h1>
            <p class="text-sm text-slate-500 mt-1">Issue and review disbursements to therapists (payroll)</p>
          </div>

          <!-- Tab bar -->
          <div class="mb-6 border-b border-slate-200">
            <nav class="-mb-px flex gap-6" aria-label="Service payment tabs">
              <button
                v-if="canRecord"
                type="button"
                class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
                :class="activeTab === 'issue' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                @click="activeTab = 'issue'"
              >
                Pay Therapist
              </button>
              <button
                type="button"
                class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
                :class="activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                @click="activeTab = 'history'"
              >
                History
              </button>
            </nav>
          </div>

          <div v-if="loadError" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-700">{{ loadError }}</p>
          </div>

          <div v-show="activeTab === 'issue' && canRecord">
            <PayTherapistWizard :therapists="therapists" :payment-types="paymentTypes" @created="onCreated" />
          </div>

          <div v-show="activeTab === 'history'">
            <ServicePaymentsList :therapists="therapists" />
          </div>
        </main>
        <O2Footer />
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
import PayTherapistWizard from '../components/service-payments/PayTherapistWizard.vue';
import ServicePaymentsList from '../components/service-payments/ServicePaymentsList.vue';
import { TherapistsHttpClient } from '../services/TherapistsHttpClient';
import { PaymentsHttpClient } from '../services/PaymentsHttpClient';
import { useClaims, Permissions } from '../composables/useClaims';
import type { PaymentTypeInfo } from '../interfaces/Payment';

interface TherapistOption {
  therapistId: number
  therapistName: string
}

export default defineComponent({
  name: 'ServicePaymentsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, PayTherapistWizard, ServicePaymentsList },
  setup() {
    const { hasClaim } = useClaims();
    const canRecord = hasClaim('Permission', Permissions.ServicePaymentsRecord);

    const therapistsClient = new TherapistsHttpClient();
    const paymentsClient = new PaymentsHttpClient();

    const therapists = ref<TherapistOption[]>([]);
    const paymentTypes = ref<PaymentTypeInfo[]>([]);
    const loadError = ref('');
    // MGR lands on the Pay Therapist tab; AM (view-only) lands on History.
    const activeTab = ref<'issue' | 'history'>(canRecord ? 'issue' : 'history');

    const onCreated = () => {
      activeTab.value = 'history';
    };

    onMounted(async () => {
      try {
        const list = await therapistsClient.getTherapists();
        therapists.value = list
          .map((t) => ({ therapistId: t.therapistId, therapistName: t.therapistName }))
          .sort((a, b) => a.therapistName.localeCompare(b.therapistName));
      } catch (e: unknown) {
        loadError.value = e instanceof Error ? e.message : 'Failed to load therapists.';
      }
      try {
        paymentTypes.value = await paymentsClient.getPaymentTypes();
      } catch {
        // Non-fatal — the method dropdown will be empty; issuing still validates server-side.
      }
    });

    return { therapists, paymentTypes, loadError, activeTab, canRecord, onCreated };
  },
});
</script>
