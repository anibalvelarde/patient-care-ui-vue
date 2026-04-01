<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
      <O2Header />
      <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Therapist Management</h1>
          <p class="text-sm text-slate-500 mt-1">View and manage therapist records</p>
        </div>
        <TherapistList
          :therapists="therapists"
          :initial-tab="initialTab"
          :loading="loading"
          :error="error"
          :past-due-therapists="pastDueTherapists"
          @add="openAdd"
          @edit="openEdit"
          @toggle-active="toggleActive"
          @retry="loadTherapists"
          @tab-change="onTabChange"
        />
      </main>
        <O2Footer />
      </div>
    </div>

    <TherapistFormModal
      :visible="modalVisible"
      :therapist="editingTherapist"
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
import TherapistList from '../components/therapists/TherapistList.vue';
import TherapistFormModal from '../components/therapists/TherapistFormModal.vue';
import { TherapistsHttpClient } from '../services/TherapistsHttpClient';
import type { Therapist } from '../interfaces/Therapist';
import type { DelinquentTherapist } from '../interfaces/Delinquency';

export default defineComponent({
  name: 'TherapistsView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, TherapistList, TherapistFormModal },
  setup() {
    const route = useRoute();
    const client = new TherapistsHttpClient();

    const validTabs = ['all', 'active', 'inactive', 'delinquent'] as const;
    type TabValue = typeof validTabs[number];
    const initialTab = computed<TabValue>(() => {
      const tab = route.query.tab as string | undefined;
      return tab && (validTabs as readonly string[]).includes(tab) ? tab as TabValue : 'all';
    });
    const therapists = ref<Therapist[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingTherapist = ref<Therapist | null>(null);
    const pastDueTherapists = ref<DelinquentTherapist[]>([]);
    const pastDueLoaded = ref(false);

    const loadTherapists = async () => {
      loading.value = true;
      error.value = '';
      try {
        therapists.value = await client.getTherapists();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load therapists.';
      } finally {
        loading.value = false;
      }
    };

    const openAdd = () => {
      editingTherapist.value = null;
      modalVisible.value = true;
    };

    const openEdit = (therapist: Therapist) => {
      editingTherapist.value = therapist;
      modalVisible.value = true;
    };

    const toggleActive = async (therapist: Therapist) => {
      try {
        const parsed = parseName(therapist.therapistName);
        await client.updateTherapist(therapist.therapistId, {
          firstName: parsed.firstName,
          middleName: parsed.middleName || undefined,
          lastName: parsed.lastName,
          email: therapist.email,
          phoneNumber: therapist.phoneNumber,
          feePerSession: therapist.feePerSession,
          feePctPerSession: therapist.feePctPerSession,
          activeStatus: !therapist.isActive,
        });
        await loadTherapists();
        pastDueLoaded.value = false;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to update therapist status.';
      }
    };

    const loadPastDueTherapists = async () => {
      if (pastDueLoaded.value) return;
      try {
        pastDueTherapists.value = await client.getPastDueTherapists(therapists.value);
        pastDueLoaded.value = true;
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load delinquent therapists.';
      }
    };

    const onTabChange = (tab: string) => {
      if (tab === 'delinquent') {
        loadPastDueTherapists();
      }
    };

    const onSaved = () => {
      loadTherapists();
      pastDueLoaded.value = false;
    };

    onMounted(loadTherapists);

    return {
      therapists,
      loading,
      error,
      modalVisible,
      editingTherapist,
      pastDueTherapists,
      initialTab,
      loadTherapists,
      openAdd,
      openEdit,
      toggleActive,
      onSaved,
      onTabChange,
    };
  },
});

function parseName(therapistName: string) {
  const [last, rest] = therapistName.split(', ');
  const [first, ...middleParts] = (rest || '').split(' ');
  return { firstName: first || '', middleName: middleParts.join(' '), lastName: last || '' };
}

</script>
