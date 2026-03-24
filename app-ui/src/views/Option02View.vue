<template>
  <div class="min-h-screen bg-gray-100 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <O2Header />
        <main class="flex-1 p-6 overflow-y-auto">
          <!-- Back to delinquent review banner -->
          <router-link
            v-if="cameFromDelinquent"
            to="/patients?tab=delinquent"
            class="mb-4 flex items-center space-x-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors w-fit"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="font-medium">Back to Delinquent Review</span>
          </router-link>

          <O2StatsBar :appointments="allAppointments" />
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div class="xl:col-span-1">
              <O2Calendar
                :selectedDate="selectedDate"
                @date-selected="updateSelectedDate"
              />
            </div>
            <div class="xl:col-span-2">
              <O2Appointments
                :selectedDate="selectedDate"
                :highlightedSessionId="highlightedSessionId"
                :refresh-key="appointmentRefreshKey"
                @appointments-loaded="onAppointmentsLoaded"
                @view-payments="onViewPayments"
                @pay="onPay"
              />
            </div>
          </div>
        </main>
        <O2Footer />
      </div>
    </div>

    <SessionPaymentsModal
      :visible="paymentsModalVisible"
      :session="paymentsModalSession"
      @close="paymentsModalVisible = false"
    />

    <PaymentFormModal
      :visible="payFormVisible"
      :payment="null"
      :pre-selected-caretaker-id="preSelectedCaretakerId"
      @close="payFormVisible = false"
      @saved="onPaymentSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Appointment } from '../interfaces/Appointment';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2StatsBar from '../components/option02/O2StatsBar.vue';
import O2Calendar from '../components/option02/O2Calendar.vue';
import O2Appointments from '../components/option02/O2Appointments.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import SessionPaymentsModal from '../components/payments/SessionPaymentsModal.vue';
import PaymentFormModal from '../components/payments/PaymentFormModal.vue';
import { PatientsHttpClient } from '../services/PatientsHttpClient';

export default defineComponent({
  name: 'Option02View',
  components: {
    O2MobileNav,
    O2Sidebar,
    O2Header,
    O2StatsBar,
    O2Calendar,
    O2Appointments,
    O2Footer,
    SessionPaymentsModal,
    PaymentFormModal,
  },
  setup() {
    const route = useRoute();
    const patientsClient = new PatientsHttpClient();
    // Read route date param in setup (before child components mount)
    // so the calendar initializes with the correct date immediately
    const initDate = (() => {
      const dateParam = route.query.date as string | undefined;
      if (dateParam) {
        const d = new Date(dateParam + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US');
        }
      }
      return new Date().toLocaleDateString('en-US');
    })();

    const selectedDate = ref<string>(initDate);
    const allAppointments = ref<Appointment[]>([]);

    // Session payments modal state
    const paymentsModalVisible = ref(false);
    const paymentsModalSession = ref<Appointment | null>(null);

    // Payment form modal state
    const payFormVisible = ref(false);
    const preSelectedCaretakerId = ref(0);

    // Refresh key to force O2Appointments re-fetch
    const appointmentRefreshKey = ref(0);

    const highlightedSessionId = computed(() => {
      const val = route.query.highlightSession;
      return val ? Number(val) : undefined;
    });

    const cameFromDelinquent = computed(() => !!route.query.highlightSession);

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    const onAppointmentsLoaded = (appointments: Appointment[]) => {
      allAppointments.value = appointments;
    };

    const onViewPayments = (appt: Appointment) => {
      paymentsModalSession.value = appt;
      paymentsModalVisible.value = true;
    };

    const onPay = async (appt: Appointment) => {
      // Look up patient's primary caretakers
      preSelectedCaretakerId.value = 0;
      try {
        const patient = await patientsClient.getPatient(appt.patientId);
        const primaryCaretakers = (patient.caretakers || []).filter(
          (c) => c.isPrimaryCaretaker
        );
        if (primaryCaretakers.length === 1) {
          preSelectedCaretakerId.value = primaryCaretakers[0].caretakerId;
        }
      } catch {
        // If lookup fails, user can select manually
      }
      payFormVisible.value = true;
    };

    const onPaymentSaved = () => {
      appointmentRefreshKey.value++;
    };

    return {
      selectedDate,
      allAppointments,
      highlightedSessionId,
      cameFromDelinquent,
      updateSelectedDate,
      onAppointmentsLoaded,
      onViewPayments,
      onPay,
      onPaymentSaved,
      paymentsModalVisible,
      paymentsModalSession,
      payFormVisible,
      preSelectedCaretakerId,
      appointmentRefreshKey,
    };
  },
});
</script>
