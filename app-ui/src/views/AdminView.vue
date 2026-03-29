<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col">
        <O2Header />
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-slate-800">Admin</h1>
            <p class="text-sm text-slate-500 mt-1">System configuration and settings</p>
          </div>

          <SiteList
            :sites="sites"
            :loading="loading"
            :error="error"
            @add="openAdd"
            @edit="openEdit"
            @retry="loadSites"
          />
        </main>
        <O2Footer />
      </div>
    </div>

    <SiteFormModal
      :visible="modalVisible"
      :site="editingSite"
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
import SiteList from '../components/sites/SiteList.vue';
import SiteFormModal from '../components/sites/SiteFormModal.vue';
import { SitesHttpClient } from '../services/SitesHttpClient';
import type { Site } from '../interfaces/Site';

export default defineComponent({
  name: 'AdminView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, SiteList, SiteFormModal },
  setup() {
    const client = new SitesHttpClient();

    const sites = ref<Site[]>([]);
    const loading = ref(false);
    const error = ref('');
    const modalVisible = ref(false);
    const editingSite = ref<Site | null>(null);

    const loadSites = async () => {
      loading.value = true;
      error.value = '';
      try {
        sites.value = await client.getSites();
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load sites.';
      } finally {
        loading.value = false;
      }
    };

    const openAdd = () => {
      editingSite.value = null;
      modalVisible.value = true;
    };

    const openEdit = (site: Site) => {
      editingSite.value = site;
      modalVisible.value = true;
    };

    const onSaved = () => {
      loadSites();
    };

    onMounted(loadSites);

    return {
      sites,
      loading,
      error,
      modalVisible,
      editingSite,
      loadSites,
      openAdd,
      openEdit,
      onSaved,
    };
  },
});
</script>
