<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
        <p class="text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <button
        class="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        @click="$emit('add')"
      >
        + {{ addButtonLabel }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="px-6 py-12 text-center">
      <p class="text-sm text-slate-500">Loading...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="px-6 py-12 text-center">
      <p class="text-sm text-red-600 mb-3">{{ error }}</p>
      <button
        class="text-sm text-violet-600 hover:text-violet-700 font-medium"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="px-6 py-12 text-center">
      <p class="text-sm text-slate-400">No items configured yet.</p>
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead>
        <tr class="border-b border-slate-100">
          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">ID</th>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            {{ col.label }}
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="String(getItemId(item))"
          class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
        >
          <td class="px-6 py-3 text-sm text-slate-400">{{ getItemId(item) }}</td>
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-3 text-sm"
            :class="col.primary ? 'text-slate-800 font-medium' : 'text-slate-600'"
            :title="col.primary ? getTimestampTooltip(item) : undefined"
          >
            {{ (item as Record<string, unknown>)[col.key] }}
          </td>
          <td class="px-6 py-3 text-right" :title="getTimestampTooltip(item)">
            <button
              class="text-slate-400 hover:text-violet-600 transition-colors"
              @click="$emit('edit', item)"
            >
              <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export interface ColumnDef {
  key: string;
  label: string;
  primary?: boolean;
}

export default defineComponent({
  name: 'LookupTableManager',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    addButtonLabel: { type: String, required: true },
    columns: { type: Array as PropType<ColumnDef[]>, required: true },
    idKey: { type: String, required: true },
    items: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['add', 'edit', 'retry'],
  setup(props) {
    const getItemId = (item: Record<string, unknown>): unknown => {
      return item[props.idKey];
    };
    const getTimestampTooltip = (item: Record<string, unknown>): string | undefined => {
      const created = item.createdTimestamp as string | undefined;
      const updated = item.lastUpdatedTimestamp as string | undefined;
      if (!created && !updated) return undefined;
      const parts: string[] = [];
      if (created) parts.push(`Created: ${created}`);
      if (updated) parts.push(`Last Updated: ${updated}`);
      return parts.join('\n');
    };
    return { getItemId, getTimestampTooltip };
  },
});
</script>
