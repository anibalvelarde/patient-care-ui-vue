<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
      <O2Header />
      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Patient Management</h1>
          <p class="text-sm text-slate-500 mt-1">View and manage patient records</p>
        </div>
        <PatientList
          :patients="patients"
          :initial-tab="initialTab"
          :loading="loading"
          :error="error"
          :past-due-patients="pastDuePatients"
          @add="openAdd"
          @edit="openEdit"
          @toggle-active="toggleActive"
          @retry="loadPatients"
          @tab-change="onTabChange"
        />
      </main>
        <O2Footer />
      </div>
    </div>

    <PatientFormModal
      :visible="modalVisible"
      :patient="editingPatient"
      @close="modalVisible = false"
      @saved="onSaved"
      @created-temp-mrn="onCreatedTempMrn"
    />

    <!-- Temp MRN creation banner -->
    <teleport to="body">
      <div
        v-if="tempMrnBanner"
        class="fixed top-4 right-4 z-50 max-w-sm bg-amber-50 border border-amber-300 rounded-xl shadow-lg p-4"
      >
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-amber-800">Temporary MRN Assigned</p>
            <p class="text-xs text-amber-700 mt-1">
              <span class="font-mono font-semibold">{{ tempMrnBanner }}</span> was assigned as a temporary MRN. The patient is inactive until a permanent MRN is provided.
            </p>
          </div>
          <button
            class="p-1 rounded text-amber-400 hover:text-amber-600"
            @click="tempMrnBanner = ''"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import PatientList from '../components/patients/PatientList.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import { PatientsHttpClient } from '../services/PatientsHttpClient';
import type { Patient } from '../interfaces/Patient';
import { isTemporaryMrn } from '../interfaces/Patient';
import type { DelinquentPatient } from '../interfaces/Delinquency';

export default defineComponent({
  name: 'PatientsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, PatientList, PatientFormModal },
  setup() {
    const route = useRoute();
    const client = new PatientsHttpClient();

    const validTabs = ['all', 'active', 'inactive', 'delinquent'] as const;
    type TabValue = typeof validTabs[number];
    const initialTab = computed<TabValue>(() => {
      const tab = route.query.tab as string | undefined;
      return tab && (validTabs as readonly string[]).includes(tab) ? tab as TabValue : 'all';
    });
    const patients = ref<Patient[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPatient = ref<Patient | null>(null);
    const tempMrnBanner = ref('');
    const pastDuePatients = ref<DelinquentPatient[]>([]);
    const pastDueLoaded = ref(false);

    const loadPatients = async () => {
      loading.value = true;
      error.value = '';
      try {
        patients.value = await client.getPatients();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load patients.';
      } finally {
        loading.value = false;
      }
    };

    const openAdd = () => {
      editingPatient.value = null;
      modalVisible.value = true;
    };

    const openEdit = (patient: Patient) => {
      editingPatient.value = patient;
      modalVisible.value = true;
    };

    const toggleActive = async (patient: Patient) => {
      // Guard: cannot activate a patient with a temporary MRN
      if (!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)) {
        error.value = 'Cannot activate a patient with a temporary MRN. Edit the patient to assign a permanent MRN first.';
        return;
      }
      try {
        const parsed = parseName(patient.patientName);
        await client.updatePatient(patient.patientId, {
          firstName: parsed.firstName,
          middleName: parsed.middleName || undefined,
          lastName: parsed.lastName,
          dateOfBirth: formatDobForApi(patient.dateOfBirth),
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          gender: patient.gender,
          activeStatus: !patient.isActive,
        });
        await loadPatients();
        pastDueLoaded.value = false;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update patient status.';
      }
    };

    const loadPastDuePatients = async () => {
      if (pastDueLoaded.value) return;
      try {
        pastDuePatients.value = await client.getPastDuePatients();
        pastDueLoaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load delinquent patients.';
      }
    };

    const onTabChange = (tab: string) => {
      if (tab === 'delinquent') {
        loadPastDuePatients();
      }
    };

    const onSaved = () => {
      loadPatients();
      pastDueLoaded.value = false;
    };

    const onCreatedTempMrn = (patient: Patient) => {
      tempMrnBanner.value = patient.medicalRecordNumber;
      setTimeout(() => { tempMrnBanner.value = ''; }, 8000);
    };

    onMounted(loadPatients);

    return {
      patients,
      loading,
      error,
      modalVisible,
      editingPatient,
      tempMrnBanner,
      pastDuePatients,
      initialTab,
      loadPatients,
      openAdd,
      openEdit,
      toggleActive,
      onSaved,
      onCreatedTempMrn,
      onTabChange,
    };
  },
});

function parseName(patientName: string) {
  const [last, rest] = patientName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

function formatDobForApi(dob: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
</script>
