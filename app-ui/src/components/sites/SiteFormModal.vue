<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Slide-over panel -->
      <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isEdit ? 'Edit Site' : 'Add Site' }}
          </h2>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form class="flex-1 overflow-y-auto px-6 py-4 space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Site Name *</label>
            <input
              v-model="form.siteName"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">RUC</label>
            <input
              v-model="form.ruc"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Taxpayer ID"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Inception Date *</label>
            <input
              v-model="form.inceptionDate"
              type="date"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              v-model="form.address"
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full address"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="0.000001"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 8.983333"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="0.000001"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. -79.516670"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Idle auto-logoff (minutes)</label>
            <input
              v-model.number="form.idleLogoffMinutes"
              type="number"
              min="0"
              max="480"
              step="1"
              data-testid="site-idle-logoff-input"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-500">
              Sign users out after this many minutes of inactivity (a 60-second warning shows first).
              <span class="font-medium">0 = disabled.</span>
            </p>
          </div>

        </form>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 space-y-3">
          <FormErrorBanner :message="error" />
          <div class="flex items-center justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="saving || hasError"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              @click="handleSubmit"
            >
              {{ saving ? 'Saving...' : 'Save Site' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, type PropType } from 'vue';
import type { Site } from '../../interfaces/Site';
import { SitesHttpClient } from '../../services/SitesHttpClient';
import { useModalForm } from '../../composables/useModalForm';
import FormErrorBanner from '../shared/FormErrorBanner.vue';

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default defineComponent({
  name: 'SiteFormModal',
  components: { FormErrorBanner },
  props: {
    visible: { type: Boolean, required: true },
    site: { type: Object as PropType<Site | null>, default: null },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { error, hasError, saving, setError, clearError, submit } = useModalForm();
    const client = new SitesHttpClient();

    const form = reactive({
      siteName: '',
      ruc: '',
      inceptionDate: '',
      address: '',
      latitude: null as number | null,
      longitude: null as number | null,
      idleLogoffMinutes: 60,
    });

    const isEdit = ref(false);

    watch(form, () => clearError(), { deep: true });

    watch(
      () => props.visible,
      (val) => {
        if (!val) return;
        clearError();
        if (props.site) {
          isEdit.value = true;
          form.siteName = props.site.siteName;
          form.ruc = props.site.ruc || '';
          form.inceptionDate = formatDateForInput(props.site.inceptionDate);
          form.address = props.site.address || '';
          form.latitude = props.site.latitude;
          form.longitude = props.site.longitude;
          form.idleLogoffMinutes = props.site.idleLogoffMinutes ?? 60;
        } else {
          isEdit.value = false;
          form.siteName = '';
          form.ruc = '';
          form.inceptionDate = '';
          form.address = '';
          form.latitude = null;
          form.longitude = null;
          form.idleLogoffMinutes = 60;
        }
      }
    );

    const handleSubmit = () => {
      if (!form.siteName || !form.inceptionDate) {
        setError('Please fill in all required fields.');
        return;
      }
      const idle = form.idleLogoffMinutes;
      if (!Number.isInteger(idle) || idle < 0 || idle > 480) {
        setError('Idle auto-logoff must be a whole number between 0 and 480 minutes.');
        return;
      }
      return submit(async () => {
        const data = {
          siteName: form.siteName,
          ruc: form.ruc || undefined,
          inceptionDate: form.inceptionDate,
          address: form.address || undefined,
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
          idleLogoffMinutes: form.idleLogoffMinutes,
        };

        if (isEdit.value && props.site) {
          await client.updateSite(props.site.siteId, data);
        } else {
          await client.createSite(data);
        }
        emit('saved');
        emit('close');
      });
    };

    return { form, isEdit, saving, error, hasError, handleSubmit };
  },
});
</script>
