<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
        <p class="text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <button
        v-if="canManage"
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
          <!-- WP-39 follow-up: SortOrder (default, ASC) and Name are sortable — PatientTable's
               ▲/▼ pattern. Owner ruling: sortOrder renders as a narrow muted "#" utility column
               (machinery, not content) but stays the click target restoring the default order. -->
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            :class="[
              isSortable(col.key) ? 'cursor-pointer select-none hover:text-slate-700' : '',
              col.key === 'sortOrder' ? 'w-12' : '',
            ]"
            :title="col.key === 'sortOrder' ? 'Sort order' : undefined"
            :data-testid="isSortable(col.key) ? `lookup-sort-header-${col.key === 'sortOrder' ? 'sort-order' : col.key}` : undefined"
            @click="isSortable(col.key) && setSort(col.key)"
          >
            <span class="flex items-center space-x-1">
              <span>{{ col.label }}</span>
              <span
                v-if="sortKey === col.key"
                :class="col.key === 'sortOrder' ? 'text-violet-400 text-[10px]' : 'text-violet-600'"
                data-testid="lookup-sort-indicator"
              >
                {{ sortAsc ? '&#9650;' : '&#9660;' }}
              </span>
            </span>
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in sortedItems"
          :key="String(getItemId(item))"
          class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
        >
          <td class="px-6 py-3 text-sm text-slate-400">{{ getItemId(item) }}</td>
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-3"
            :class="col.key === 'sortOrder'
              ? 'text-xs text-slate-400'
              : col.primary ? 'text-sm text-slate-800 font-medium' : 'text-sm text-slate-600'"
            :title="col.primary ? getTimestampTooltip(item) : undefined"
            :data-testid="col.key === 'sortOrder' ? 'lookup-sort-order-cell' : undefined"
          >
            {{ (item as Record<string, unknown>)[col.key] }}
          </td>
          <td class="px-6 py-3 text-right whitespace-nowrap" :title="getTimestampTooltip(item)">
            <!-- WP-39: per-row prices action (specialty-types), claim-gated by the parent.
                 Owner ruling: icon button matching the action column's icon metaphor — fa-tags
                 (price tags), NOT a bare $ which could read as the nearby Default $ column. -->
            <button
              v-if="showPricesAction"
              class="text-slate-400 hover:text-violet-600 transition-colors mr-3"
              title="Edit pricing tables"
              aria-label="Edit pricing tables"
              data-testid="specialty-prices-action"
              @click="$emit('prices', item)"
            >
              <font-awesome-icon :icon="['fas', 'tags']" class="w-4 h-4 inline" />
            </button>
            <button
              v-if="canManage"
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
import { computed, defineComponent, ref, type PropType } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTags } from '@fortawesome/free-solid-svg-icons';

library.add(faTags);

export interface ColumnDef {
  key: string;
  label: string;
  primary?: boolean;
}

export default defineComponent({
  name: 'LookupTableManager',
  components: { FontAwesomeIcon },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    addButtonLabel: { type: String, required: true },
    columns: { type: Array as PropType<ColumnDef[]>, required: true },
    idKey: { type: String, required: true },
    items: { type: Array as PropType<Record<string, unknown>[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    // WP-39C: /admin is no longer SYSADMIN-only — structural Add/Edit stays behind the
    // table's Manage claim, which the parent resolves and passes down.
    canManage: { type: Boolean, default: true },
    // WP-39: show the per-row prices action — fa-tags icon button, "Edit pricing tables"
    // (specialty-types, Specialties.Prices.Edit).
    showPricesAction: { type: Boolean, default: false },
  },
  emits: ['add', 'edit', 'retry', 'prices'],
  setup(props) {
    const getItemId = (item: Record<string, unknown>): unknown => {
      return item[props.idKey];
    };

    // ── WP-39 follow-up: header sorting (client-side, no refetch) ───────────
    // Default mirrors the server's ORDER BY SortOrder ASC, Name ASC; clicking Name sorts by
    // name (case-insensitive, toggle ASC/DESC); clicking Sort Order restores the default.
    const sortKey = ref<'sortOrder' | 'name'>('sortOrder');
    const sortAsc = ref(true);

    const isSortable = (key: string) => key === 'sortOrder' || key === 'name';

    const setSort = (key: string) => {
      if (key === 'name') {
        if (sortKey.value === 'name') {
          sortAsc.value = !sortAsc.value;
        } else {
          sortKey.value = 'name';
          sortAsc.value = true;
        }
      } else if (key === 'sortOrder') {
        sortKey.value = 'sortOrder';
        sortAsc.value = true; // Sort Order is always the default ASC order
      }
    };

    const nameOf = (item: Record<string, unknown>) => String(item.name ?? '');
    const byName = (a: Record<string, unknown>, b: Record<string, unknown>) =>
      nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' });

    const sortedItems = computed(() => {
      const list = [...props.items]; // Array.prototype.sort is stable — ties keep input order
      if (sortKey.value === 'name') {
        list.sort((a, b) => (sortAsc.value ? byName(a, b) : byName(b, a)));
      } else {
        // SortOrder ASC with case-insensitive Name ASC tiebreak (mirrors the server order)
        list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || byName(a, b));
      }
      return list;
    });
    const getTimestampTooltip = (item: Record<string, unknown>): string | undefined => {
      const created = item.createdTimestamp as string | undefined;
      const updated = item.lastUpdatedTimestamp as string | undefined;
      if (!created && !updated) return undefined;
      const parts: string[] = [];
      if (created) parts.push(`Created: ${created}`);
      if (updated) parts.push(`Last Updated: ${updated}`);
      return parts.join('\n');
    };
    return { getItemId, getTimestampTooltip, sortKey, sortAsc, sortedItems, isSortable, setSort };
  },
});
</script>
