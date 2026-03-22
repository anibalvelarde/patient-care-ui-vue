<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center space-x-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by caretaker name..."
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
        />
      </div>
      <button
        class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        @click="$emit('add')"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Record Payment
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="px-6 py-12 text-center text-sm text-slate-400">
      Loading payments...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="px-6 py-12 text-center">
      <p class="text-sm text-red-600 mb-3">{{ error }}</p>
      <button
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        @click="$emit('retry')"
      >
        Retry
      </button>
    </div>

    <!-- Table -->
    <PaymentTable
      v-else
      :payments="filteredPayments"
      @edit="(p) => $emit('edit', p)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, type PropType } from 'vue';
import type { PaymentRecord } from '../../interfaces/Payment';
import PaymentTable from './PaymentTable.vue';

export default defineComponent({
  name: 'PaymentList',
  components: { PaymentTable },
  props: {
    payments: { type: Array as PropType<PaymentRecord[]>, required: true },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
  },
  emits: ['add', 'edit', 'retry'],
  setup(props) {
    const searchQuery = ref('');

    const filteredPayments = computed(() => {
      if (!searchQuery.value) return props.payments;
      const q = searchQuery.value.toLowerCase();
      return props.payments.filter((p) =>
        p.caretakerName.toLowerCase().includes(q)
      );
    });

    return { searchQuery, filteredPayments };
  },
});
</script>
