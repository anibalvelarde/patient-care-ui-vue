<template>
  <!-- Desktop table -->
  <div class="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700"
            @click="toggleSort(col.key)"
          >
            <span class="flex items-center space-x-1">
              <span>{{ col.label }}</span>
              <span v-if="sortKey === col.key" class="text-blue-600">
                {{ sortAsc ? '&#9650;' : '&#9660;' }}
              </span>
            </span>
          </th>
          <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="caretaker in sortedCaretakers"
          :key="caretaker.caretakerId"
          class="hover:bg-slate-50 transition-colors"
        >
          <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ caretaker.caretakerName }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ caretaker.email }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ caretaker.phoneNumber }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ caretaker.notes }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ caretaker.patients.length }}</td>
          <td class="px-4 py-3">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                caretaker.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500',
              ]"
            >
              {{ caretaker.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end space-x-2">
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="View patients"
                @click="$emit('view-patients', caretaker)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit caretaker"
                @click="$emit('edit', caretaker)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                :title="caretaker.isActive ? 'Deactivate caretaker' : 'Activate caretaker'"
                @click="$emit('toggle-active', caretaker)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="caretaker.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="sortedCaretakers.length === 0">
          <td colspan="7" class="px-4 py-12 text-center text-sm text-slate-400">
            No caretakers found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile cards -->
  <div class="md:hidden space-y-3">
    <div
      v-for="caretaker in sortedCaretakers"
      :key="caretaker.caretakerId"
      class="bg-white rounded-xl border border-slate-200 p-4"
    >
      <div class="flex items-start justify-between mb-2">
        <div>
          <p class="text-sm font-semibold text-slate-800">{{ caretaker.caretakerName }}</p>
        </div>
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            caretaker.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500',
          ]"
        >
          {{ caretaker.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
        <div><span class="font-medium">Email:</span> {{ caretaker.email }}</div>
        <div><span class="font-medium">Phone:</span> {{ caretaker.phoneNumber }}</div>
        <div><span class="font-medium">Notes:</span> {{ caretaker.notes }}</div>
        <div><span class="font-medium"># Patients:</span> {{ caretaker.patients.length }}</div>
      </div>
      <div class="flex items-center justify-end space-x-2 border-t border-slate-100 pt-2">
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          @click="$emit('view-patients', caretaker)"
        >
          Patients
        </button>
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          @click="$emit('edit', caretaker)"
        >
          Edit
        </button>
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="caretaker.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'"
          @click="$emit('toggle-active', caretaker)"
        >
          {{ caretaker.isActive ? 'Deactivate' : 'Activate' }}
        </button>
      </div>
    </div>
    <div v-if="sortedCaretakers.length === 0" class="text-center py-12 text-sm text-slate-400">
      No caretakers found.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { Caretaker } from '../../interfaces/Caretaker';

export default defineComponent({
  name: 'CaretakerTable',
  props: {
    caretakers: { type: Array as PropType<Caretaker[]>, required: true },
  },
  emits: ['edit', 'toggle-active', 'view-patients'],
  setup(props) {
    const sortKey = ref('caretakerName');
    const sortAsc = ref(true);

    const columns = [
      { key: 'caretakerName', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'notes', label: 'Notes' },
      { key: 'patientsCount', label: '# Patients' },
      { key: 'isActive', label: 'Status' },
    ];

    const toggleSort = (key: string) => {
      if (sortKey.value === key) {
        sortAsc.value = !sortAsc.value;
      } else {
        sortKey.value = key;
        sortAsc.value = true;
      }
    };

    const sortedCaretakers = computed(() => {
      const list = [...props.caretakers];
      list.sort((a, b) => {
        let aVal: unknown;
        let bVal: unknown;
        if (sortKey.value === 'patientsCount') {
          aVal = a.patients.length;
          bVal = b.patients.length;
        } else {
          aVal = (a as unknown as Record<string, unknown>)[sortKey.value];
          bVal = (b as unknown as Record<string, unknown>)[sortKey.value];
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortAsc.value ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortAsc.value ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortAsc.value ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
        }
        return 0;
      });
      return list;
    });

    return { columns, sortKey, sortAsc, sortedCaretakers, toggleSort };
  },
});
</script>
