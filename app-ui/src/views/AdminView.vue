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

              <!-- Appointment Statuses -->
              <div v-else-if="activeSection === 'appointment-statuses'">
                <LookupTableManager
                  title="Appointment Statuses"
                  subtitle="Status workflow for therapy sessions"
                  add-button-label="Add Status"
                  :columns="apptStatusColumns"
                  id-key="appointmentStatusId"
                  :items="(apptStatuses.items.value as unknown as Record<string, unknown>[])"
                  :loading="apptStatuses.loading.value"
                  :error="apptStatuses.error.value"
                  @add="apptStatuses.openAdd"
                  @edit="apptStatuses.openEdit"
                  @retry="apptStatuses.loadItems"
                />
              </div>

              <!-- Payment Types -->
              <div v-else-if="activeSection === 'payment-types'">
                <LookupTableManager
                  title="Payment Types"
                  subtitle="Accepted payment methods"
                  add-button-label="Add Payment Type"
                  :columns="paymentTypeColumns"
                  id-key="paymentTypeId"
                  :items="(paymentTypes.items.value as unknown as Record<string, unknown>[])"
                  :loading="paymentTypes.loading.value"
                  :error="paymentTypes.error.value"
                  @add="paymentTypes.openAdd"
                  @edit="paymentTypes.openEdit"
                  @retry="paymentTypes.loadItems"
                />
              </div>

              <!-- Role Types -->
              <div v-else-if="activeSection === 'role-types'">
                <LookupTableManager
                  title="Role Types"
                  subtitle="System user role classifications"
                  add-button-label="Add Role"
                  :columns="roleTypeColumns"
                  id-key="roleId"
                  :items="(roleTypes.items.value as unknown as Record<string, unknown>[])"
                  :loading="roleTypes.loading.value"
                  :error="roleTypes.error.value"
                  @add="roleTypes.openAdd"
                  @edit="roleTypes.openEdit"
                  @retry="roleTypes.loadItems"
                />
              </div>

              <!-- Specialty Types -->
              <div v-else-if="activeSection === 'specialty-types'">
                <LookupTableManager
                  title="Specialty Types"
                  subtitle="Therapy specializations offered at the clinic"
                  add-button-label="Add Specialty"
                  :columns="specialtyTypeColumns"
                  id-key="specialtyId"
                  :items="(specialtyTypes.items.value as unknown as Record<string, unknown>[])"
                  :loading="specialtyTypes.loading.value"
                  :error="specialtyTypes.error.value"
                  @add="specialtyTypes.openAdd"
                  @edit="specialtyTypes.openEdit"
                  @retry="specialtyTypes.loadItems"
                />
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
import type { FieldDef } from '../components/admin/LookupFormModal.vue';
import type { ColumnDef } from '../components/admin/LookupTableManager.vue';
import { SitesHttpClient } from '../services/SitesHttpClient';
import { LookupHttpClient } from '../services/LookupHttpClient';
import { useLookupCrud } from '../composables/useLookupCrud';
import type { Site } from '../interfaces/Site';
import type {
  AppointmentStatusItem,
  PaymentTypeItem,
  RoleTypeItem,
  SpecialtyTypeItem,
} from '../interfaces/Lookups';

export default defineComponent({
  name: 'AdminView',
  components: {
    O2MobileNav, O2Sidebar, O2Header, O2Footer,
    SiteList, SiteFormModal,
    AdminAccordionNav, LookupTableManager, LookupFormModal,
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

    // ── Appointment Statuses ────────────────────────────────────
    const apptStatuses = useLookupCrud<AppointmentStatusItem>(
      () => lookupClient.getAppointmentStatuses(),
      (data) => lookupClient.createAppointmentStatus({ statusName: data.statusName, statusDescription: data.statusDescription }),
      (id, data) => lookupClient.updateAppointmentStatus(id, { statusName: data.statusName, statusDescription: data.statusDescription }),
    );
    const apptStatusColumns: ColumnDef[] = [
      { key: 'statusName', label: 'Status Name', primary: true },
      { key: 'statusDescription', label: 'Description' },
    ];

    // ── Payment Types ───────────────────────────────────────────
    const paymentTypes = useLookupCrud<PaymentTypeItem>(
      () => lookupClient.getPaymentTypes(),
      (data) => lookupClient.createPaymentType({ abbreviation: data.abbreviation, name: data.name }),
      (id, data) => lookupClient.updatePaymentType(id, { abbreviation: data.abbreviation, name: data.name }),
    );
    const paymentTypeColumns: ColumnDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', primary: true },
      { key: 'name', label: 'Name' },
    ];

    // ── Role Types ──────────────────────────────────────────────
    const roleTypes = useLookupCrud<RoleTypeItem>(
      () => lookupClient.getRoleTypes(),
      (data) => lookupClient.createRoleType({ roleName: data.roleName }),
      (id, data) => lookupClient.updateRoleType(id, { roleName: data.roleName }),
    );
    const roleTypeColumns: ColumnDef[] = [
      { key: 'roleName', label: 'Role Name', primary: true },
    ];

    // ── Specialty Types ─────────────────────────────────────────
    const specialtyTypes = useLookupCrud<SpecialtyTypeItem>(
      () => lookupClient.getSpecialtyTypes(),
      (data) => lookupClient.createSpecialtyType({ abbreviation: data.abbreviation, name: data.name }),
      (id, data) => lookupClient.updateSpecialtyType(id, { abbreviation: data.abbreviation, name: data.name }),
    );
    const specialtyTypeColumns: ColumnDef[] = [
      { key: 'abbreviation', label: 'Abbreviation', primary: true },
      { key: 'name', label: 'Specialty Name' },
    ];

    // ── Lookup modal orchestration ──────────────────────────────
    const lookupModalVisible = ref(false);
    const lookupModalTitle = ref('');
    const lookupModalFields = ref<FieldDef[]>([]);
    const lookupModalInitialValues = ref<Record<string, string> | null>(null);
    const lookupModalEditId = ref<number | undefined>(undefined);
    const lookupModalSaveHandler = ref<((data: Record<string, string>, id?: number) => Promise<void>) | null>(null);

    const fieldDefs: Record<string, { addTitle: string; editTitle: string; fields: FieldDef[]; idKey: string }> = {
      'appointment-statuses': {
        addTitle: 'Add Status',
        editTitle: 'Edit Status',
        fields: [
          { key: 'statusName', label: 'Status Name', required: true, maxLength: 50 },
          { key: 'statusDescription', label: 'Description', maxLength: 200 },
        ],
        idKey: 'appointmentStatusId',
      },
      'payment-types': {
        addTitle: 'Add Payment Type',
        editTitle: 'Edit Payment Type',
        fields: [
          { key: 'abbreviation', label: 'Abbreviation', required: true, maxLength: 50 },
          { key: 'name', label: 'Name', required: true, maxLength: 50 },
        ],
        idKey: 'paymentTypeId',
      },
      'role-types': {
        addTitle: 'Add Role',
        editTitle: 'Edit Role',
        fields: [
          { key: 'roleName', label: 'Role Name', required: true, maxLength: 50 },
        ],
        idKey: 'roleId',
      },
      'specialty-types': {
        addTitle: 'Add Specialty',
        editTitle: 'Edit Specialty',
        fields: [
          { key: 'abbreviation', label: 'Abbreviation', required: true, maxLength: 50 },
          { key: 'name', label: 'Specialty Name', required: true, maxLength: 75 },
        ],
        idKey: 'specialtyId',
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crudMap: Record<string, ReturnType<typeof useLookupCrud<any>>> = {
      'appointment-statuses': apptStatuses,
      'payment-types': paymentTypes,
      'role-types': roleTypes,
      'specialty-types': specialtyTypes,
    };

    // Override the openAdd/openEdit on each crud instance to open the shared modal
    for (const [sectionKey, crud] of Object.entries(crudMap)) {
      const def = fieldDefs[sectionKey];
      const originalOpenAdd = crud.openAdd;
      const originalOpenEdit = crud.openEdit;

      crud.openAdd = () => {
        originalOpenAdd();
        lookupModalTitle.value = def.addTitle;
        lookupModalFields.value = def.fields;
        lookupModalInitialValues.value = null;
        lookupModalEditId.value = undefined;
        lookupModalSaveHandler.value = crud.handleSave;
        lookupModalVisible.value = true;
      };

      crud.openEdit = (item: unknown) => {
        originalOpenEdit(item);
        const record = item as Record<string, unknown>;
        lookupModalTitle.value = def.editTitle;
        lookupModalFields.value = def.fields;
        lookupModalInitialValues.value = {};
        for (const field of def.fields) {
          lookupModalInitialValues.value[field.key] = String(record[field.key] ?? '');
        }
        lookupModalEditId.value = record[def.idKey] as number;
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
      apptStatuses, apptStatusColumns,
      paymentTypes, paymentTypeColumns,
      roleTypes, roleTypeColumns,
      specialtyTypes, specialtyTypeColumns,
      // Modal
      lookupModalVisible, lookupModalTitle, lookupModalFields,
      lookupModalInitialValues, handleLookupSubmit,
    };
  },
});
</script>
