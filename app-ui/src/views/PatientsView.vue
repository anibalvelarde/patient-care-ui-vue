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
          :loading="loading"
          :error="error"
          @add="openAdd"
          @edit="openEdit"
          @toggle-active="toggleActive"
          @retry="loadPatients"
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
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import PatientList from '../components/patients/PatientList.vue';
import PatientFormModal from '../components/patients/PatientFormModal.vue';
import { PatientsHttpClient } from '../services/PatientsHttpClient';
import type { Patient } from '../interfaces/Patient';

export default defineComponent({
  name: 'PatientsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, PatientList, PatientFormModal },
  setup() {
    const client = new PatientsHttpClient();
    const patients = ref<Patient[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingPatient = ref<Patient | null>(null);

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
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update patient status.';
      }
    };

    const onSaved = () => {
      loadPatients();
    };

    onMounted(loadPatients);

    return {
      patients,
      loading,
      error,
      modalVisible,
      editingPatient,
      loadPatients,
      openAdd,
      openEdit,
      toggleActive,
      onSaved,
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
