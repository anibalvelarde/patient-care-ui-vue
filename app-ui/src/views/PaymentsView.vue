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
          <PaymentList
            :payments="payments"
            :loading="loading"
            :error="error"
            @add="openAdd"
            @edit="openEdit"
            @retry="loadPayments"
          />
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
import { defineComponent, ref, onMounted } from 'vue';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import PaymentList from '../components/payments/PaymentList.vue';
import PaymentFormModal from '../components/payments/PaymentFormModal.vue';
import { PaymentsHttpClient } from '../services/PaymentsHttpClient';
import type { PaymentRecord } from '../interfaces/Payment';

export default defineComponent({
  name: 'PaymentsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, PaymentList, PaymentFormModal },
  setup() {
    const client = new PaymentsHttpClient();
    const payments = ref<PaymentRecord[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPayment = ref<PaymentRecord | null>(null);

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
      loadPayments,
      openAdd,
      openEdit,
      onSaved,
    };
  },
});
</script>
