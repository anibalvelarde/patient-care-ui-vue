<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
        <O2Header />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-slate-800">Payment Management</h1>
            <p class="text-sm text-slate-500 mt-1">Record and manage patient payments</p>
          </div>

          <!-- WP-49: Late Fees lives here, in the money-IN domain. Service Payments is money
               OUT (therapist payroll) and would be the wrong neighbourhood for a charge levied
               on a caretaker. -->
          <div v-if="canViewLateFees" class="mb-6 border-b border-slate-200">
            <nav class="-mb-px flex gap-6" data-testid="payments-tabs">
              <button
                :class="tabClass('payments')"
                data-testid="payments-tab-payments"
                @click="activeTab = 'payments'"
              >
                Payments
              </button>
              <button
                :class="tabClass('lateFees')"
                data-testid="payments-tab-late-fees"
                @click="activeTab = 'lateFees'"
              >
                Late Fees
              </button>
            </nav>
          </div>

          <PaymentList
            v-if="activeTab === 'payments'"
            :payments="payments"
            :loading="loading"
            :error="error"
            @add="openAdd"
            @edit="openEdit"
            @retry="loadPayments"
          />
          <ApplyLateFeesWizard v-else />
        </main>
        <O2Footer />
      </div>
    </div>

    <PaymentFormModal
      :visible="modalVisible"
      :payment="editingPayment"
      @close="modalVisible = false"
      @saved="onSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import PaymentList from '../components/payments/PaymentList.vue';
import PaymentFormModal from '../components/payments/PaymentFormModal.vue';
import ApplyLateFeesWizard from '../components/payments/ApplyLateFeesWizard.vue';
import { PaymentsHttpClient } from '../services/PaymentsHttpClient';
import type { PaymentRecord } from '../interfaces/Payment';
import { useClaims } from '../composables/useClaims';
import { Permissions } from '../generated/permissions';

export default defineComponent({
  name: 'PaymentsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, PaymentList, PaymentFormModal, ApplyLateFeesWizard },
  setup() {
    const client = new PaymentsHttpClient();
    const { hasClaim } = useClaims();
    const payments = ref<PaymentRecord[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPayment = ref<PaymentRecord | null>(null);

    // The tab is gated on the PREVIEW claim, not the manage claim — an AM should be able to
    // read what is owed even though the Apply button stays disabled for them.
    const activeTab = ref<'payments' | 'lateFees'>('payments');
    const canViewLateFees = computed(() => hasClaim('Permission', Permissions.PatientsDelinquentView));

    const tabClass = (tab: string) =>
      tab === activeTab.value
        ? 'border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-700'
        : 'border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 hover:text-slate-700';

    const loadPayments = async () => {
      loading.value = true;
      error.value = '';
      try {
        payments.value = await client.getPayments();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load payments.';
      } finally {
        loading.value = false;
      }
    };

    const openAdd = () => {
      editingPayment.value = null;
      modalVisible.value = true;
    };

    const openEdit = (payment: PaymentRecord) => {
      editingPayment.value = payment;
      modalVisible.value = true;
    };

    const onSaved = () => {
      loadPayments();
    };

    onMounted(loadPayments);

    return {
      payments,
      loading,
      error,
      modalVisible,
      editingPayment,
      activeTab,
      canViewLateFees,
      tabClass,
      loadPayments,
      openAdd,
      openEdit,
      onSaved,
    };
  },
});
</script>
