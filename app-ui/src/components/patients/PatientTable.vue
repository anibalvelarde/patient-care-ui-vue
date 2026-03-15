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
          v-for="patient in sortedPatients"
          :key="patient.patientId"
          class="hover:bg-slate-50 transition-colors"
        >
          <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ patient.patientName }}</td>
          <td class="px-4 py-3 text-sm">
            <span v-if="isTemporaryMrn(patient.medicalRecordNumber)" class="inline-flex items-center space-x-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {{ patient.medicalRecordNumber }}
              </span>
              <svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </span>
            <span v-else class="text-slate-600">{{ patient.medicalRecordNumber }}</span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ formatDate(patient.dateOfBirth) }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ patient.gender }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ patient.email }}</td>
          <td class="px-4 py-3 text-sm text-slate-600">{{ patient.phoneNumber }}</td>
          <td class="px-4 py-3">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                patient.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500',
              ]"
            >
              {{ patient.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end space-x-2">
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit patient"
                @click="$emit('edit', patient)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                class="p-1.5 rounded-lg transition-colors"
                :class="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'"
                :title="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)
                  ? 'Cannot activate — assign a permanent MRN first'
                  : patient.isActive ? 'Deactivate patient' : 'Activate patient'"
                :disabled="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)"
                @click="$emit('toggle-active', patient)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="patient.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="sortedPatients.length === 0">
          <td colspan="8" class="px-4 py-12 text-center text-sm text-slate-400">
            No patients found.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile cards -->
  <div class="md:hidden space-y-3">
    <div
      v-for="patient in sortedPatients"
      :key="patient.patientId"
      class="bg-white rounded-xl border border-slate-200 p-4"
    >
      <div class="flex items-start justify-between mb-2">
        <div>
          <p class="text-sm font-semibold text-slate-800">{{ patient.patientName }}</p>
          <p class="text-xs" :class="isTemporaryMrn(patient.medicalRecordNumber) ? 'text-amber-600 font-medium' : 'text-slate-400'">
            MRN: {{ patient.medicalRecordNumber }}
            <span v-if="isTemporaryMrn(patient.medicalRecordNumber)" class="ml-1 text-amber-500">(temporary)</span>
          </p>
        </div>
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            patient.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-500',
          ]"
        >
          {{ patient.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
        <div><span class="font-medium">DOB:</span> {{ formatDate(patient.dateOfBirth) }}</div>
        <div><span class="font-medium">Gender:</span> {{ patient.gender }}</div>
        <div><span class="font-medium">Email:</span> {{ patient.email }}</div>
        <div><span class="font-medium">Phone:</span> {{ patient.phoneNumber }}</div>
      </div>
      <div class="flex items-center justify-end space-x-2 border-t border-slate-100 pt-2">
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          @click="$emit('edit', patient)"
        >
          Edit
        </button>
        <button
          class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)
            ? 'text-slate-300 cursor-not-allowed'
            : patient.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'"
          :disabled="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)"
          :title="!patient.isActive && isTemporaryMrn(patient.medicalRecordNumber)
            ? 'Assign a permanent MRN before activating'
            : ''"
          @click="$emit('toggle-active', patient)"
        >
          {{ patient.isActive ? 'Deactivate' : 'Activate' }}
        </button>
      </div>
    </div>
    <div v-if="sortedPatients.length === 0" class="text-center py-12 text-sm text-slate-400">
      No patients found.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { Patient } from '../../interfaces/Patient';
import { isTemporaryMrn } from '../../interfaces/Patient';

export default defineComponent({
  name: 'PatientTable',
  props: {
    patients: { type: Array as PropType<Patient[]>, required: true },
  },
  emits: ['edit', 'toggle-active'],
  setup(props) {
    const sortKey = ref('patientName');
    const sortAsc = ref(true);

    const columns = [
      { key: 'patientName', label: 'Name' },
      { key: 'medicalRecordNumber', label: 'MRN' },
      { key: 'dateOfBirth', label: 'DOB' },
      { key: 'gender', label: 'Gender' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
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

    const sortedPatients = computed(() => {
      const list = [...props.patients];
      list.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortKey.value];
        const bVal = (b as unknown as Record<string, unknown>)[sortKey.value];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortAsc.value ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortAsc.value ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
        }
        return 0;
      });
      return list;
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return { columns, sortKey, sortAsc, sortedPatients, toggleSort, formatDate, isTemporaryMrn };
  },
});
</script>
