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
                  :can-manage="canManageSites"
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
                    :columns="columnsFor(section.key)"
                    id-key="id"
                    :items="itemsFor(section.key)"
                    :loading="crudMap[section.key].loading.value"
                    :error="crudMap[section.key].error.value"
                    :can-manage="canManageLookup(section.key)"
                    :show-prices-action="section.key === 'specialty-types' && canEditPrices"
                    @add="crudMap[section.key].openAdd"
                    @edit="crudMap[section.key].openEdit"
                    @retry="crudMap[section.key].loadItems"
                    @prices="openPrices"
                  />
                </div>
              </template>

              <!-- Merge Patients (WP-22, SYSADMIN-only) -->
              <div v-if="activeSection === 'merge-patients'">
                <PatientMergePanel />
              </div>

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

    <!-- WP-39 (G5): per-specialty duration price sheet -->
    <SpecialtyPricesModal
      :visible="pricesModalVisible"
      :specialty="pricesSpecialty"
      @close="pricesModalVisible = false"
      @saved="onPricesSaved"
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
import SpecialtyPricesModal from '../components/admin/SpecialtyPricesModal.vue';
import AboutPanel from '../components/admin/AboutPanel.vue';
import PatientMergePanel from '../components/admin/PatientMergePanel.vue';
import type { FieldDef } from '../components/admin/LookupFormModal.vue';
import type { ColumnDef } from '../components/admin/LookupTableManager.vue';
import { SitesHttpClient } from '../services/SitesHttpClient';
import { LookupHttpClient } from '../services/LookupHttpClient';
import { useLookupCrud, type LookupFormData } from '../composables/useLookupCrud';
import { useClaims, Permissions } from '../composables/useClaims';
import { LOOKUP_VIEW_CLAIMS, LOOKUP_MANAGE_CLAIMS } from '../composables/adminSections';
import type { Site } from '../interfaces/Site';
import type { LookupItem } from '../interfaces/Lookups';

export default defineComponent({
  name: 'AdminView',
  components: {
    O2MobileNav, O2Sidebar, O2Header, O2Footer,
    SiteList, SiteFormModal,
    AdminAccordionNav, LookupTableManager, LookupFormModal, SpecialtyPricesModal,
    AboutPanel, PatientMergePanel,
  },
  setup() {
    // WP-39C: /admin admits every Admin.View holder (MGR/AM/OWN + SYSADMIN), so each section
    // resolves its own claim: *.View gates visibility/fetching, *.Manage gates Add/Edit, and
    // the specialty Prices… action rides Specialties.Prices.Edit.
    const { hasClaim } = useClaims();
    const lookupClient = new LookupHttpClient();

    const canViewSites = hasClaim('Permission', Permissions.AdminSitesView);
    const canManageSites = hasClaim('Permission', Permissions.AdminSitesManage);
    const canViewLookup = (tableKey: string) => hasClaim('Permission', LOOKUP_VIEW_CLAIMS[tableKey]);
    const canManageLookup = (tableKey: string) => hasClaim('Permission', LOOKUP_MANAGE_CLAIMS[tableKey]);
    const canEditPrices = hasClaim('Permission', Permissions.SpecialtiesPricesEdit);

    // ── Sites (existing logic) ──────────────────────────────────
    const siteClient = new SitesHttpClient();
    const sites = ref<Site[]>([]);
    const siteLoading = ref(false);
    const siteError = ref('');
    const siteModalVisible = ref(false);
    const editingSite = ref<Site | null>(null);

    const loadSites = async () => {
      if (!canViewSites) return; // avoid a guaranteed 403 for e.g. AM
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
    // Owner ruling (WP-39 follow-up): Sort Order is machinery, not content — it renders as a
    // narrow muted "#" utility column, always the LAST data column (after the specialty extras).
    const baseLookupColumns: ColumnDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', primary: true },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
    ];
    const sortOrderColumn: ColumnDef = { key: 'sortOrder', label: '#' };
    const lookupColumns: ColumnDef[] = [...baseLookupColumns, sortOrderColumn];

    const lookupFields: FieldDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', required: true, maxLength: 50 },
      { key: 'name', label: 'Name', required: true, maxLength: 75 },
      { key: 'description', label: 'Description', maxLength: 200 },
      { key: 'sortOrder', label: 'Sort Order', type: 'number', helper: 'Items display in ascending order; ties sort alphabetically.' },
    ];

    // WP-23 (F6): specialty-types alone gains the default session price column/field.
    // WP-39 (PR-2): + a read-only On-site column for everyone who can see the table.
    const columnsFor = (tableKey: string): ColumnDef[] =>
      tableKey === 'specialty-types'
        ? [...baseLookupColumns, { key: 'defaultAmount', label: 'Default $' }, { key: 'offeredOnSiteDisplay', label: 'On-site' }, sortOrderColumn]
        : lookupColumns;

    // WP-39 (PR-2): the "Offered on-site" checkbox is structural (describes the service, not its
    // price) — it appears only for Admin.Lookups.SpecialtyType.Manage holders (SYSADMIN), same
    // policy as Default $ (whose form is Manage-gated too, via the hidden Add/Edit controls).
    const fieldsFor = (tableKey: string): FieldDef[] => {
      if (tableKey !== 'specialty-types') return lookupFields;
      const fields: FieldDef[] = [
        ...lookupFields,
        { key: 'defaultAmount', label: 'Default $ (session price)', type: 'number' },
      ];
      if (canManageLookup('specialty-types')) {
        fields.push({ key: 'offeredOnSite', label: 'Offered on-site (customer home/facility)', type: 'checkbox' });
      }
      return fields;
    };

    // ── Lookup section metadata ─────────────────────────────────
    const lookupSections = [
      { key: 'appointment-statuses', title: 'Appointment Statuses', subtitle: 'Status workflow for therapy sessions', addButtonLabel: 'Add Status', addTitle: 'Add Status', editTitle: 'Edit Status' },
      { key: 'payment-types', title: 'Payment Types', subtitle: 'Accepted payment methods', addButtonLabel: 'Add Payment Type', addTitle: 'Add Payment Type', editTitle: 'Edit Payment Type' },
      { key: 'role-types', title: 'Role Types', subtitle: 'System user role classifications', addButtonLabel: 'Add Role', addTitle: 'Add Role', editTitle: 'Edit Role' },
      { key: 'specialty-types', title: 'Specialty Types', subtitle: 'Therapy specializations offered at the clinic', addButtonLabel: 'Add Specialty', addTitle: 'Add Specialty', editTitle: 'Edit Specialty' },
    ];

    /** Convert form data (strings + checkbox booleans) to a typed request payload */
    const toPayload = (data: LookupFormData) => {
      const payload: Record<string, unknown> = {};
      const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      if (str(data.abbreviation)) payload.abbreviation = str(data.abbreviation);
      if (str(data.name)) payload.name = str(data.name);
      if (str(data.description)) payload.description = str(data.description);
      if (data.sortOrder !== undefined && data.sortOrder !== '') payload.sortOrder = Number(data.sortOrder);
      // WP-23 (F6): specialty-types only (the field is absent from other tables' forms);
      // omitted when blank = unchanged server-side.
      if (data.defaultAmount !== undefined && data.defaultAmount !== '') payload.defaultAmount = Number(data.defaultAmount);
      // WP-39 (PR-2): checkbox present only on the SYSADMIN specialty form; explicit boolean.
      if (typeof data.offeredOnSite === 'boolean') payload.offeredOnSite = data.offeredOnSite;
      return payload;
    };

    // ── Create one crud instance per table ──────────────────────
    // Sections the user can't view never fetch (their nav entries are hidden anyway; skipping
    // the call avoids guaranteed 403s — e.g. AM holds only the SpecialtyType read claim).
    const makeCrud = (tableName: string) =>
      useLookupCrud<LookupItem>(
        () => (canViewLookup(tableName) ? lookupClient.getAll(tableName) : Promise.resolve([])),
        (data) => lookupClient.create(tableName, toPayload(data) as { abbreviation: string; name: string }),
        (id, data) => lookupClient.update(tableName, id, toPayload(data)),
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crudMap: Record<string, ReturnType<typeof useLookupCrud<any>>> = {};
    for (const section of lookupSections) {
      crudMap[section.key] = makeCrud(section.key);
    }

    // WP-39: display projection — LookupTableManager prints raw cell values, so the boolean
    // On-site flag becomes a friendly Yes/— column for specialty-types.
    const itemsFor = (tableKey: string): Record<string, unknown>[] => {
      const items = crudMap[tableKey].items.value as unknown as Record<string, unknown>[];
      if (tableKey !== 'specialty-types') return items;
      return items.map((item) => ({
        ...item,
        offeredOnSiteDisplay: item.offeredOnSite === true ? 'Yes' : '—',
      }));
    };

    // ── Default section: first one the user's claims can see ────
    const sectionOrder: Array<{ key: string; allowed: () => boolean }> = [
      { key: 'sites', allowed: () => canViewSites },
      ...lookupSections.map((s) => ({ key: s.key, allowed: () => canViewLookup(s.key) })),
      { key: 'merge-patients', allowed: () => hasClaim('Permission', Permissions.PatientsMerge) },
    ];
    const firstVisibleSection = sectionOrder.find((s) => s.allowed())?.key ?? 'sites';
    const activeSection = ref(firstVisibleSection);

    // ── Lookup modal orchestration ──────────────────────────────
    const lookupModalVisible = ref(false);
    const lookupModalTitle = ref('');
    const lookupModalFields = ref<FieldDef[]>([]);
    const lookupModalInitialValues = ref<Record<string, string> | null>(null);
    const lookupModalEditId = ref<number | undefined>(undefined);
    const lookupModalReadonlyFields = ref<{ label: string; value: string }[]>([]);
    const lookupModalSaveHandler = ref<((data: LookupFormData, id?: number) => Promise<void>) | null>(null);

    // Override the openAdd/openEdit on each crud instance to open the shared modal
    for (const section of lookupSections) {
      const crud = crudMap[section.key];
      const originalOpenAdd = crud.openAdd;
      const originalOpenEdit = crud.openEdit;

      crud.openAdd = () => {
        originalOpenAdd();
        lookupModalTitle.value = section.addTitle;
        lookupModalFields.value = fieldsFor(section.key);
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
        lookupModalFields.value = fieldsFor(section.key);
        lookupModalInitialValues.value = {};
        for (const field of fieldsFor(section.key)) {
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

    const handleLookupSubmit = async (formData: LookupFormData) => {
      if (lookupModalSaveHandler.value) {
        try {
          await lookupModalSaveHandler.value(formData, lookupModalEditId.value);
          lookupModalVisible.value = false;
        } catch {
          // Error is handled inside the composable
        }
      }
    };

    // ── WP-39 (G5): specialty prices modal ──────────────────────
    const pricesModalVisible = ref(false);
    const pricesSpecialty = ref<LookupItem | null>(null);

    const openPrices = (item: unknown) => {
      pricesSpecialty.value = item as LookupItem;
      pricesModalVisible.value = true;
    };
    const onPricesSaved = () => {
      // Refresh the table so the lookup projection's current-effective durationPrices stay honest.
      crudMap['specialty-types'].loadItems();
    };

    return {
      activeSection,
      // Sites
      sites, siteLoading, siteError, siteModalVisible, editingSite,
      loadSites, openSiteAdd, openSiteEdit, onSiteSaved, canManageSites,
      // Lookup tables
      lookupSections, lookupColumns, columnsFor, itemsFor, crudMap,
      canManageLookup, canEditPrices,
      // Modal
      lookupModalVisible, lookupModalTitle, lookupModalFields,
      lookupModalInitialValues, lookupModalReadonlyFields, handleLookupSubmit,
      // Prices modal
      pricesModalVisible, pricesSpecialty, openPrices, onPricesSaved,
    };
  },
});
</script>
