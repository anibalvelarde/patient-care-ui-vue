<template>
  <div>
    <!-- Print-only header -->
    <div class="hidden print:block text-center mb-6">
      <h1 class="text-2xl font-bold text-slate-900">NeuroCorp Therapy Center</h1>
      <h2 class="text-lg font-semibold text-slate-700 mt-1">Therapist Statement</h2>
      <p class="text-sm text-slate-500 mt-1">{{ formatDate(statement.statementDate) }}</p>
    </div>

    <!-- Pro-forma banner (also visible in print) -->
    <div
      v-if="statement.isProForma"
      class="mb-6 rounded-lg border border-amber-400 bg-amber-100 text-amber-900 px-4 py-3"
    >
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-sm font-medium">
          Estimated &mdash; Service Payments not yet tracked. This report shows gross amount due based on completed sessions.
        </p>
      </div>
    </div>

    <!-- Statement Header -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none print:border-none">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ statement.therapistName }}</h2>
          <p class="text-sm text-slate-500 mt-1">
            Period: {{ formatDate(statement.periodStart) }} &mdash; {{ formatDate(statement.periodEnd) }}
          </p>
          <p class="text-sm text-slate-500">
            Statement Date: {{ formatDate(statement.statementDate) }}
          </p>
        </div>
        <div v-if="statement.patients.length > 0">
          <h3 class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Patients</h3>
          <ul class="space-y-0.5">
            <li v-for="p in statement.patients" :key="p.patientId" class="text-sm text-slate-700">
              {{ p.patientName }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="statement.patients.length === 0"
      class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6 text-center print:shadow-none print:border-none"
    >
      <svg class="mx-auto h-10 w-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h6m-3-3l3 3m0 0l-3 3m3-3H9" />
      </svg>
      <p class="text-sm text-slate-500">No sessions in this period.</p>
    </div>

    <!-- Patient blocks -->
    <div
      v-for="patient in statement.patients"
      :key="patient.patientId"
      class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 print:shadow-none print:border-none print:break-inside-avoid"
    >
      <div class="px-6 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-800">{{ patient.patientName }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapy Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Fee</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Discount</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Provider Amount</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr
              v-for="session in patient.sessions"
              :key="session.sessionId"
              :class="session.isBillable ? 'hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'"
            >
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(session.sessionDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ session.sessionTime }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ session.therapyType }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  :class="session.isBillable
                    ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'
                    : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600'"
                >
                  {{ session.statusName }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(session.amount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(session.discountAmount) }}</td>
              <td
                class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium"
                :class="session.isBillable ? 'text-slate-900' : 'text-slate-400'"
                :title="session.isBillable ? undefined : `Non-billable: ${session.statusName}`"
              >
                {{ formatCurrency(session.providerAmount) }}
              </td>
            </tr>
            <!-- Subtotal row -->
            <tr class="bg-slate-50 font-medium">
              <td colspan="3" class="px-4 py-3 text-sm text-slate-700">
                Subtotal &mdash;
                {{ patient.completedCount }} completed, {{ patient.nonBillableCount }} non-billable
              </td>
              <td class="px-4 py-3"></td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(patient.subtotalFee) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(patient.subtotalDiscount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(patient.subtotalProviderAmount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Service Payments section (always empty in WP-13B; v-if guard for forward-compat) -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 print:shadow-none print:border-none">
      <div class="px-6 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-800">Service Payments</h3>
      </div>
      <div v-if="statement.servicePayments.length === 0" class="px-6 py-6 text-center text-sm text-slate-400">
        No service payments recorded for this period.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Allocations</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="sp in statement.servicePayments" :key="sp.servicePaymentId" class="hover:bg-slate-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(sp.paymentDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right font-medium">{{ formatCurrency(sp.amount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ sp.paymentTypeName }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ sp.referenceNumber || '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-900">
                {{ sp.allocations.length }} session{{ sp.allocations.length !== 1 ? 's' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none print:border-none print:break-inside-avoid">
      <h3 class="text-base font-semibold text-slate-800 mb-4">Statement Summary</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ statement.summary.totalCompletedSessions }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Non-billable</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ statement.summary.totalNonBillableSessions }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Fee</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalFee) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Discount</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalDiscount) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Provider Amount</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalProviderAmount) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Service Payments</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalServicePaymentsApplied) }}</p>
        </div>
      </div>
      <div class="border-t border-slate-200 pt-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-700">Estimated Amount Due</p>
          <p class="text-3xl font-bold text-blue-700">
            {{ formatCurrency(statement.summary.estimatedAmountDue) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Print Button -->
    <div class="flex justify-end print:hidden">
      <button
        class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        @click="printStatement"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Statement
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { TherapistStatement } from '../../interfaces/TherapistStatement';

export default defineComponent({
  name: 'TherapistStatementScreen',
  props: {
    statement: { type: Object as PropType<TherapistStatement>, required: true },
  },
  setup() {
    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const printStatement = () => {
      window.print();
    };

    return { formatCurrency, formatDate, printStatement };
  },
});
</script>
