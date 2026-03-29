<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Toolbar -->
    <div class="flex items-center justify-between p-4 border-b border-slate-100">
      <div>
        <h2 class="text-base font-semibold text-slate-800">Sites</h2>
        <p class="text-xs text-slate-500 mt-0.5">Manage clinic locations</p>
      </div>
      <button
        class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        @click="$emit('add')"
      >
        <font-awesome-icon :icon="['fas', 'plus']" class="mr-1.5" />
        Add Site
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center text-slate-400">
      <p class="text-sm">Loading sites...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-8 text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button
        class="mt-2 text-sm text-blue-600 hover:text-blue-800"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="sites.length === 0" class="p-8 text-center text-slate-400">
      <font-awesome-icon :icon="['fas', 'building']" class="text-3xl mb-2" />
      <p class="text-sm">No sites configured yet.</p>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead>
        <tr class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
          <th class="px-4 py-3">Site Name</th>
          <th class="px-4 py-3">RUC</th>
          <th class="px-4 py-3">Address</th>
          <th class="px-4 py-3">Since</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="text-sm text-slate-700">
        <tr
          v-for="site in sites"
          :key="site.siteId"
          class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
        >
          <td class="px-4 py-3 font-medium">{{ site.siteName }}</td>
          <td class="px-4 py-3 text-slate-500">{{ site.ruc || '--' }}</td>
          <td class="px-4 py-3 text-slate-500">{{ site.address || '--' }}</td>
          <td class="px-4 py-3 text-slate-500">{{ formatDate(site.inceptionDate) }}</td>
          <td class="px-4 py-3 text-right">
            <button
              class="text-violet-600 hover:text-violet-800"
              title="Edit"
              @click="$emit('edit', site)"
            >
              <font-awesome-icon :icon="['fas', 'pen']" class="text-xs" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus, faPen, faBuilding } from '@fortawesome/free-solid-svg-icons';
import type { Site } from '../../interfaces/Site';

library.add(faPlus, faPen, faBuilding);

export default defineComponent({
  name: 'SiteList',
  components: { FontAwesomeIcon },
  props: {
    sites: { type: Array as PropType<Site[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['add', 'edit', 'retry'],
  setup() {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '--';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return { formatDate };
  },
});
</script>
