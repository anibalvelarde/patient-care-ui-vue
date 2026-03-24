<template>
  <div>
    <!-- Print-only header -->
    <div class="hidden print:block text-center mb-6">
      <h1 class="text-2xl font-bold text-slate-900">NeuroCorp Therapy Center</h1>
      <h2 class="text-lg font-semibold text-slate-700 mt-1">Statement of Accounts</h2>
      <p class="text-sm text-slate-500 mt-1">{{ formatDate(statement.statementDate) }}</p>
    </div>

    <!-- Statement Header -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none print:border-none">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ statement.caretakerName }}</h2>
          <p class="text-sm text-slate-500 mt-1">
            Period: {{ formatDate(statement.periodStart) }} &mdash; {{ formatDate(statement.periodEnd) }}
          </p>
          <p class="text-sm text-slate-500">
            Statement Date: {{ formatDate(statement.statementDate) }}
          </p>
        </div>
        <div>
          <h3 class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Patients</h3>
          <ul class="space-y-0.5">
            <li v-for="p in statement.patients" :key="p.patientId" class="text-sm text-slate-700">
              {{ p.patientName }}
              <span v-if="p.isPrimaryCaretaker" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-1">Primary</span>
              <span v-if="p.relationshipToPatient" class="text-slate-400 ml-1">({{ p.relationshipToPatient }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Charges Table -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 print:shadow-none print:border-none">
      <div class="px-6 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-800">Charges</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Therapist</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Discount</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Net</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Paid</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Due</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="charge in statement.charges" :key="charge.sessionId" class="hover:bg-slate-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(charge.sessionDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ charge.patientName }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ charge.therapistName }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ charge.therapyType }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(charge.amount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(charge.discountAmount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right font-medium">{{ formatCurrency(charge.netCharge) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right">{{ formatCurrency(charge.amountPaid) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium" :class="charge.amountDue > 0 ? 'text-red-600' : 'text-slate-900'">
                {{ formatCurrency(charge.amountDue) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  v-if="charge.isPastDue"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                >
                  Past Due
                </span>
                <span
                  v-else-if="charge.amountDue <= 0"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                >
                  Paid
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  Open
                </span>
              </td>
            </tr>
            <tr v-if="statement.charges.length === 0">
              <td colspan="10" class="px-4 py-8 text-center text-sm text-slate-400">
                No charges in this period.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payments Table -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 print:shadow-none print:border-none">
      <div class="px-6 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-800">Payments</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check #</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Allocations</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="payment in statement.payments" :key="payment.paymentId" class="hover:bg-slate-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ formatDate(payment.paymentDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900 text-right font-medium">{{ formatCurrency(payment.amount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                  {{ payment.paymentType }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{{ payment.checkNumber || '—' }}</td>
              <td class="px-4 py-3 text-sm text-slate-900">
                <span v-if="payment.allocations.length === 0" class="text-slate-400">None</span>
                <span v-else>{{ payment.allocations.length }} session{{ payment.allocations.length !== 1 ? 's' : '' }}</span>
              </td>
            </tr>
            <tr v-if="statement.payments.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
                No payments in this period.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none print:border-none">
      <h3 class="text-base font-semibold text-slate-800 mb-4">Account Summary</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Charges</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalCharges) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Discounts</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalDiscounts) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Net Charges</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalNetCharges) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Payments</p>
          <p class="text-lg font-semibold text-slate-900 mt-1">{{ formatCurrency(statement.summary.totalPayments) }}</p>
        </div>
      </div>
      <div class="border-t border-slate-200 pt-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-700">Outstanding Balance</p>
          <p
            class="text-2xl font-bold"
            :class="statement.summary.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'"
          >
            {{ formatCurrency(statement.summary.outstandingBalance) }}
          </p>
        </div>
        <div v-if="statement.summary.pastDueSessionCount > 0" class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p class="text-sm text-red-700 font-medium">
            {{ statement.summary.pastDueSessionCount }} session{{ statement.summary.pastDueSessionCount !== 1 ? 's' : '' }}
            past due — {{ formatCurrency(statement.summary.pastDueAmount) }} overdue
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
import type { AccountStatement } from '../../interfaces/Statement';

export default defineComponent({
  name: 'StatementScreen',
  props: {
    statement: { type: Object as PropType<AccountStatement>, required: true },
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
