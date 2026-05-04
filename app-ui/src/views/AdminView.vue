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
            <p class="text-sm text-slate-500 mt-1">Manage system configuration and reference data</p>
          </div>

          <div class="flex gap-6">
            <!-- Accordion Nav -->
            <div class="w-56 shrink-0">
              <AdminAccordionNav
                :active-section="activeSection"
                @select="activeSection = $event"
              />
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-w-0">
              <!-- Sites -->
              <div v-if="activeSection === 'sites'">
                <SiteList
                  :sites="sites"
                  :loading="siteLoading"
                  :error="siteError"
                  @add="openSiteAdd"
                  @edit="openSiteEdit"
                  @retry="loadSites"
                />
              </div>

              <!-- Lookup Tables (all share unified columns) -->
              <template v-for="section in lookupSections" :key="section.key">
                <div v-if="activeSection === section.key">
                  <LookupTableManager
                    :title="section.title"
                    :subtitle="section.subtitle"
                    :add-button-label="section.addButtonLabel"
                    :columns="lookupColumns"
                    id-key="id"
                    :items="(crudMap[section.key].items.value as unknown as Record<string, unknown>[])"
                    :loading="crudMap[section.key].loading.value"
                    :error="crudMap[section.key].error.value"
                    @add="crudMap[section.key].openAdd"
                    @edit="crudMap[section.key].openEdit"
                    @retry="crudMap[section.key].loadItems"
                  />
                </div>
              </template>

              <!-- About -->
              <div v-if="activeSection === 'about'">
                <AboutPanel />
              </div>
            </div>
          </div>
        </main>
        <O2Footer />
      </div>
    </div>

    <!-- Site Form Modal (existing) -->
    <SiteFormModal
      :visible="siteModalVisible"
      :site="editingSite"
      @close="siteModalVisible = false"
      @saved="onSiteSaved"
    />

    <!-- Generic Lookup Form Modal -->
    <LookupFormModal
      :visible="lookupModalVisible"
      :title="lookupModalTitle"
      :fields="lookupModalFields"
      :initial-values="lookupModalInitialValues"
      :readonly-fields="lookupModalReadonlyFields"
      @close="lookupModalVisible = false"
      @submit="handleLookupSubmit"
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
import AdminAccordionNav from '../components/admin/AdminAccordionNav.vue';
import LookupTableManager from '../components/admin/LookupTableManager.vue';
import LookupFormModal from '../components/admin/LookupFormModal.vue';
import AboutPanel from '../components/admin/AboutPanel.vue';
import type { FieldDef } from '../components/admin/LookupFormModal.vue';
import type { ColumnDef } from '../components/admin/LookupTableManager.vue';
import { SitesHttpClient } from '../services/SitesHttpClient';
import { LookupHttpClient } from '../services/LookupHttpClient';
import { useLookupCrud } from '../composables/useLookupCrud';
import type { Site } from '../interfaces/Site';
import type { LookupItem } from '../interfaces/Lookups';

export default defineComponent({
  name: 'AdminView',
  components: {
    O2MobileNav, O2Sidebar, O2Header, O2Footer,
    SiteList, SiteFormModal,
    AdminAccordionNav, LookupTableManager, LookupFormModal,
    AboutPanel,
  },
  setup() {
    const activeSection = ref('sites');
    const lookupClient = new LookupHttpClient();

    // ── Sites (existing logic) ──────────────────────────────────
    const siteClient = new SitesHttpClient();
    const sites = ref<Site[]>([]);
    const siteLoading = ref(false);
    const siteError = ref('');
    const siteModalVisible = ref(false);
    const editingSite = ref<Site | null>(null);

    const loadSites = async () => {
      siteLoading.value = true;
      siteError.value = '';
      try {
        sites.value = await siteClient.getSites();
      } catch (e: unknown) {
        siteError.value = e instanceof Error ? e.message : 'Failed to load sites.';
      } finally {
        siteLoading.value = false;
      }
    };

    const openSiteAdd = () => { editingSite.value = null; siteModalVisible.value = true; };
    const openSiteEdit = (site: Site) => { editingSite.value = site; siteModalVisible.value = true; };
    const onSiteSaved = () => { loadSites(); };

    onMounted(loadSites);

    // ── Unified lookup columns & fields ─────────────────────────
    const lookupColumns: ColumnDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', primary: true },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'sortOrder', label: 'Sort Order' },
    ];

    const lookupFields: FieldDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', required: true, maxLength: 50 },
      { key: 'name', label: 'Name', required: true, maxLength: 75 },
      { key: 'description', label: 'Description', maxLength: 200 },
      { key: 'sortOrder', label: 'Sort Order', type: 'number' },
    ];

    // ── Lookup section metadata ─────────────────────────────────
    const lookupSections = [
      { key: 'appointment-statuses', title: 'Appointment Statuses', subtitle: 'Status workflow for therapy sessions', addButtonLabel: 'Add Status', addTitle: 'Add Status', editTitle: 'Edit Status' },
      { key: 'payment-types', title: 'Payment Types', subtitle: 'Accepted payment methods', addButtonLabel: 'Add Payment Type', addTitle: 'Add Payment Type', editTitle: 'Edit Payment Type' },
      { key: 'role-types', title: 'Role Types', subtitle: 'System user role classifications', addButtonLabel: 'Add Role', addTitle: 'Add Role', editTitle: 'Edit Role' },
      { key: 'specialty-types', title: 'Specialty Types', subtitle: 'Therapy specializations offered at the clinic', addButtonLabel: 'Add Specialty', addTitle: 'Add Specialty', editTitle: 'Edit Specialty' },
    ];

    /** Convert form string data to typed request payload */
    const toPayload = (data: Record<string, string>) => {
      const payload: Record<string, unknown> = {};
      if (data.abbreviation?.trim()) payload.abbreviation = data.abbreviation.trim();
      if (data.name?.trim()) payload.name = data.name.trim();
      if (data.description?.trim()) payload.description = data.description.trim();
      if (data.sortOrder !== undefined && data.sortOrder !== '') payload.sortOrder = Number(data.sortOrder);
      return payload;
    };

    // ── Create one crud instance per table ──────────────────────
    const makeCrud = (tableName: string) =>
      useLookupCrud<LookupItem>(
        () => lookupClient.getAll(tableName),
        (data) => lookupClient.create(tableName, toPayload(data) as { abbreviation: string; name: string }),
        (id, data) => lookupClient.update(tableName, id, toPayload(data)),
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crudMap: Record<string, ReturnType<typeof useLookupCrud<any>>> = {};
    for (const section of lookupSections) {
      crudMap[section.key] = makeCrud(section.key);
    }

    // ── Lookup modal orchestration ──────────────────────────────
    const lookupModalVisible = ref(false);
    const lookupModalTitle = ref('');
    const lookupModalFields = ref<FieldDef[]>([]);
    const lookupModalInitialValues = ref<Record<string, string> | null>(null);
    const lookupModalEditId = ref<number | undefined>(undefined);
    const lookupModalReadonlyFields = ref<{ label: string; value: string }[]>([]);
    const lookupModalSaveHandler = ref<((data: Record<string, string>, id?: number) => Promise<void>) | null>(null);

    // Override the openAdd/openEdit on each crud instance to open the shared modal
    for (const section of lookupSections) {
      const crud = crudMap[section.key];
      const originalOpenAdd = crud.openAdd;
      const originalOpenEdit = crud.openEdit;

      crud.openAdd = () => {
        originalOpenAdd();
        lookupModalTitle.value = section.addTitle;
        lookupModalFields.value = lookupFields;
        lookupModalInitialValues.value = null;
        lookupModalEditId.value = undefined;
        lookupModalReadonlyFields.value = [];
        lookupModalSaveHandler.value = crud.handleSave;
        lookupModalVisible.value = true;
      };

      crud.openEdit = (item: unknown) => {
        originalOpenEdit(item);
        const record = item as Record<string, unknown>;
        lookupModalTitle.value = section.editTitle;
        lookupModalFields.value = lookupFields;
        lookupModalInitialValues.value = {};
        for (const field of lookupFields) {
          lookupModalInitialValues.value[field.key] = String(record[field.key] ?? '');
        }
        lookupModalEditId.value = record.id as number;
        lookupModalReadonlyFields.value = [
          { label: 'Created', value: String(record.createdTimestamp ?? '') },
          { label: 'Last Updated', value: String(record.lastUpdatedTimestamp ?? '') },
        ];
        lookupModalSaveHandler.value = crud.handleSave;
        lookupModalVisible.value = true;
      };
    }

    const handleLookupSubmit = async (formData: Record<string, string>) => {
      if (lookupModalSaveHandler.value) {
        try {
          await lookupModalSaveHandler.value(formData, lookupModalEditId.value);
          lookupModalVisible.value = false;
        } catch {
          // Error is handled inside the composable
        }
      }
    };

    return {
      activeSection,
      // Sites
      sites, siteLoading, siteError, siteModalVisible, editingSite,
      loadSites, openSiteAdd, openSiteEdit, onSiteSaved,
      // Lookup tables
      lookupSections, lookupColumns, crudMap,
      // Modal
      lookupModalVisible, lookupModalTitle, lookupModalFields,
      lookupModalInitialValues, lookupModalReadonlyFields, handleLookupSubmit,
    };
  },
});
</script>
