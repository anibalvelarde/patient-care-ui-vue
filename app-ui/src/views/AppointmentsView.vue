<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
        <O2Header />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-slate-800">Appointment Booking</h1>
            <p class="text-sm text-slate-500 mt-1">Manage therapy appointments and track session status</p>
          </div>

          <!-- Date selector -->
          <div class="flex items-center space-x-3 mb-4">
            <label class="text-sm font-medium text-slate-700">Viewing:</label>
            <input
              v-model="selectedDate"
              type="date"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              @change="loadAppointments"
            />
            <button
              @click="setToday"
              class="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
            >
              Today
            </button>
          </div>

          <AppointmentsList
            :appointments="appointments"
            :loading="loading"
            :error="error"
            :active-filter="activeFilter"
            @book="openBooking(false)"
            @walkin="openBooking(true)"
            @retry="loadAppointments"
            @filter-change="activeFilter = $event"
            @status-change="handleQuickStatusChange"
            @show-actions="openActionsPanel"
          />
        </main>
        <O2Footer />
      </div>
    </div>

    <BookingFormModal
      :visible="bookingModalVisible"
      :is-walk-in="isWalkIn"
      @close="bookingModalVisible = false"
      @saved="onBookingSaved"
    />

    <ActionsPanel
      :visible="actionsPanelVisible"
      :appointment="selectedAppointment"
      @close="actionsPanelVisible = false"
      @updated="onStatusUpdated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import AppointmentsList from '../components/appointments/AppointmentsList.vue';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import ActionsPanel from '../components/appointments/ActionsPanel.vue';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import type { Appointment } from '../interfaces/Appointment';

export default defineComponent({
  name: 'AppointmentsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, AppointmentsList, BookingFormModal, ActionsPanel },
  setup() {
    const client = new SessionsHttpClient();
    const appointments = ref<Appointment[]>([]);
    const loading = ref(false);
    const error = ref('');
    const activeFilter = ref('all');
    const selectedDate = ref(new Date().toISOString().split('T')[0]);

    const bookingModalVisible = ref(false);
    const isWalkIn = ref(false);
    const actionsPanelVisible = ref(false);
    const selectedAppointment = ref<Appointment | null>(null);

    const loadAppointments = async () => {
      loading.value = true;
      error.value = '';
      try {
        // Load sessions for selected date + upcoming unconfirmed
        const [dateSessions, upcoming] = await Promise.all([
          client.getSessions(selectedDate.value),
          client.getUpcoming({ days: 7 }),
        ]);

        // Merge: date sessions + upcoming that aren't on the selected date
        const dateSessionIds = new Set(dateSessions.map(s => s.sessionId));
        const merged = [
          ...dateSessions,
          ...upcoming.filter(u => !dateSessionIds.has(u.sessionId)),
        ];
        appointments.value = merged.sort((a, b) => {
          if (a.sessionDate !== b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate);
          return (a.sessionTime || '').localeCompare(b.sessionTime || '');
        });
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load appointments.';
      } finally {
        loading.value = false;
      }
    };

    const setToday = () => {
      selectedDate.value = new Date().toISOString().split('T')[0];
      loadAppointments();
    };

    const openBooking = (walkIn: boolean) => {
      isWalkIn.value = walkIn;
      bookingModalVisible.value = true;
    };

    const openActionsPanel = (appt: Appointment) => {
      selectedAppointment.value = appt;
      actionsPanelVisible.value = true;
    };

    const handleQuickStatusChange = async (appt: Appointment, action: string) => {
      try {
        switch (action) {
          case 'confirm':
            await client.confirmSession(appt.sessionId, {
              confirmationMethod: 'InPerson',
              confirmationResult: 'Confirmed',
            });
            break;
          case 'checkin': await client.checkInSession(appt.sessionId); break;
          case 'start-therapy': await client.startTherapy(appt.sessionId); break;
          case 'complete': await client.completeSession(appt.sessionId); break;
        }
        await loadAppointments();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update status.';
      }
    };

    const onBookingSaved = () => loadAppointments();
    const onStatusUpdated = () => loadAppointments();

    onMounted(loadAppointments);

    return {
      appointments, loading, error, activeFilter, selectedDate,
      bookingModalVisible, isWalkIn, actionsPanelVisible, selectedAppointment,
      loadAppointments, setToday, openBooking, openActionsPanel,
      handleQuickStatusChange, onBookingSaved, onStatusUpdated,
    };
  },
});
</script>
