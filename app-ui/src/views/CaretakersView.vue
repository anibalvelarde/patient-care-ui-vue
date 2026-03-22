<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
      <O2Header />
      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Caretaker Management</h1>
          <p class="text-sm text-slate-500 mt-1">View and manage caretaker records</p>
        </div>
        <CaretakerList
          :caretakers="caretakers"
          :initial-tab="initialTab"
          :loading="loading"
          :error="error"
          @add="openAdd"
          @edit="openEdit"
          @toggle-active="toggleActive"
          @retry="loadCaretakers"
          @tab-change="onTabChange"
          @view-patients="viewPatients"
        />

        <CaretakerPatientsList
          v-if="selectedCaretaker"
          :caretaker="selectedCaretaker"
          class="mt-6"
          @close="selectedCaretaker = null"
          @updated="onPatientsUpdated"
        />
      </main>
        <O2Footer />
      </div>
    </div>

    <CaretakerFormModal
      :visible="modalVisible"
      :caretaker="editingCaretaker"
      @close="modalVisible = false"
      @saved="onSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import CaretakerList from '../components/caretakers/CaretakerList.vue';
import CaretakerFormModal from '../components/caretakers/CaretakerFormModal.vue';
import CaretakerPatientsList from '../components/caretakers/CaretakerPatientsList.vue';
import { CaretakersHttpClient } from '../services/CaretakersHttpClient';
import type { Caretaker } from '../interfaces/Caretaker';

export default defineComponent({
  name: 'CaretakersView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, CaretakerList, CaretakerFormModal, CaretakerPatientsList },
  setup() {
    const route = useRoute();
    const client = new CaretakersHttpClient();

    const validTabs = ['all', 'active', 'inactive'] as const;
    type TabValue = typeof validTabs[number];
    const initialTab = computed<TabValue>(() => {
      const tab = route.query.tab as string | undefined;
      return tab && (validTabs as readonly string[]).includes(tab) ? tab as TabValue : 'all';
    });
    const caretakers = ref<Caretaker[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingCaretaker = ref<Caretaker | null>(null);
    const selectedCaretaker = ref<Caretaker | null>(null);

    const loadCaretakers = async () => {
      loading.value = true;
      error.value = '';
      try {
        caretakers.value = await client.getCaretakers();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load caretakers.';
      } finally {
        loading.value = false;
      }
    };

    const openAdd = () => {
      editingCaretaker.value = null;
      modalVisible.value = true;
    };

    const openEdit = (caretaker: Caretaker) => {
      editingCaretaker.value = caretaker;
      modalVisible.value = true;
    };

    const toggleActive = async (caretaker: Caretaker) => {
      try {
        const parsed = parseName(caretaker.caretakerName);
        await client.updateCaretaker(caretaker.caretakerId, {
          firstName: parsed.firstName,
          middleName: parsed.middleName || undefined,
          lastName: parsed.lastName,
          email: caretaker.email,
          phoneNumber: caretaker.phoneNumber,
          notes: caretaker.notes || undefined,
          isActive: !caretaker.isActive,
        });
        await loadCaretakers();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update caretaker status.';
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onTabChange = (_tab: string) => {
      // No delinquent tab for caretakers — nothing extra to load
    };

    const viewPatients = (caretaker: Caretaker) => {
      selectedCaretaker.value = caretaker;
    };

    const onPatientsUpdated = () => {
      loadCaretakers();
    };

    const onSaved = () => {
      loadCaretakers();
    };

    onMounted(loadCaretakers);

    return {
      caretakers,
      loading,
      error,
      modalVisible,
      editingCaretaker,
      selectedCaretaker,
      initialTab,
      loadCaretakers,
      openAdd,
      openEdit,
      toggleActive,
      viewPatients,
      onPatientsUpdated,
      onSaved,
      onTabChange,
    };
  },
});

function parseName(caretakerName: string) {
  const [last, rest] = caretakerName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

</script>
