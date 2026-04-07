<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
    <!-- Header with tabs -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-700">
        <font-awesome-icon :icon="['fas', 'list']" class="mr-1.5 text-violet-500" />
        Appointments
        <span class="text-xs font-normal text-gray-400 ml-1">{{ selectedDate }}</span>
      </h2>
      <div class="flex bg-gray-100 rounded-lg p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            activeTab === tab.key
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ tab.label }} ({{ tab.key === 'am' ? amAppointments.length : tab.key === 'pm' ? pmAppointments.length : allAppointments.length }})
        </button>
      </div>
    </div>

    <!-- Appointment rows -->
    <div class="flex-1 overflow-y-auto max-h-[480px]">
      <div v-if="visibleAppointments.length > 0" class="divide-y divide-gray-100">
        <div
          v-for="appt in visibleAppointments"
          :key="appt.sessionId"
          :ref="(el) => { if (el && appt.sessionId === highlightedSessionId) highlightedEl = el as HTMLElement; }"
          :class="[
            'flex items-center px-5 py-3 gap-4 transition-colors',
            appt.sessionId === highlightedSessionId
              ? 'ring-2 ring-amber-400 bg-amber-50'
              : appt.isPastDue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50',
          ]"
        >
          <!-- Time -->
          <div class="w-16 flex-shrink-0">
            <span class="text-sm font-semibold text-gray-700">{{ appt.time || '--' }}</span>
          </div>

          <!-- Color bar -->
          <div
            :class="[
              'w-1 h-10 rounded-full flex-shrink-0',
              appt.isPastDue ? 'bg-red-400' : appt.isPaidOff ? 'bg-green-400' : 'bg-violet-400',
            ]"
          ></div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ appt.patient }}</p>
            <p class="text-xs text-gray-400 truncate">
              {{ appt.therapyTypes }} &middot; {{ appt.therapist }}
            </p>
            <!-- Mobile financial summary -->
            <p class="md:hidden text-[10px] mt-0.5 truncate">
              <span class="text-gray-500">{{ formatCurrency(appt.amount) }} billed</span>
              <span class="text-gray-300"> &middot; </span>
              <span class="text-violet-600">{{ formatCurrency(appt.providerAmount) }} provider</span>
              <span class="text-gray-300"> &middot; </span>
              <span v-if="appt.isPastDue" class="text-red-600 font-medium">{{ formatCurrency(appt.amountDue) }} due</span>
              <span v-else class="text-green-600 font-medium">{{ formatCurrency(appt.amountPaid) }} paid</span>
            </p>
          </div>

          <!-- Financial columns (desktop) -->
          <div class="hidden md:flex items-center gap-1 flex-shrink-0">
            <div class="w-16 text-right">
              <p class="text-xs font-medium text-gray-600">{{ formatCurrency(appt.amount) }}</p>
              <p class="text-[10px] text-gray-400">Billed</p>
            </div>
            <div class="w-16 text-right">
              <p class="text-xs font-medium text-violet-600">{{ formatCurrency(appt.providerAmount) }}</p>
              <p class="text-[10px] text-gray-400">Provider</p>
            </div>
            <div class="w-16 text-right">
              <p class="text-xs font-medium text-gray-600">-{{ formatCurrency(appt.discount) }}</p>
              <p class="text-[10px] text-gray-400">Discount</p>
            </div>
            <div class="w-16 text-right">
              <p class="text-xs font-medium text-green-600">{{ formatCurrency(appt.amountPaid) }}</p>
              <p class="text-[10px] text-gray-400">Paid</p>
            </div>
            <div class="w-16 text-right">
              <p :class="['text-xs font-medium', appt.amountDue > 0 ? 'text-red-600' : 'text-gray-400']">{{ formatCurrency(appt.amountDue) }}</p>
              <p class="text-[10px] text-gray-400">Due</p>
            </div>
          </div>

          <!-- Notes tooltip -->
          <div v-if="appt.notes" class="relative group flex-shrink-0">
            <font-awesome-icon
              :icon="['fas', 'sticky-note']"
              class="text-gray-300 hover:text-violet-500 cursor-pointer transition-colors"
            />
            <div class="hidden group-hover:block absolute z-20 top-1/2 right-full -translate-y-1/2 mr-2 w-56 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg leading-relaxed whitespace-normal">
              {{ appt.notes }}
              <div class="absolute top-1/2 left-full w-2 h-2 bg-gray-800 rotate-45 -translate-y-1/2 -ml-1"></div>
            </div>
          </div>

          <!-- Status badge (clickable) -->
          <div class="flex-shrink-0 flex items-center gap-1">
            <button
              v-if="appt.amountDue > 0 && !appt.isPaidOff"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer transition-colors"
              title="Record payment for this session"
              @click.stop="$emit('pay', appt)"
            >
              <font-awesome-icon :icon="['fas', 'credit-card']" class="text-[9px]" />
              Pay
            </button>
            <button
              v-if="appt.isPaidOff"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer transition-colors"
              title="View payment details"
              @click.stop="$emit('view-payments', appt)"
            >
              <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[9px]" />
              Paid
            </button>
            <button
              v-else-if="appt.isPastDue"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer transition-colors"
              title="View payment details"
              @click.stop="$emit('view-payments', appt)"
            >
              <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-[9px]" />
              Past Due
              <span class="text-red-500">&middot; {{ formatCurrency(appt.amountDue) }}</span>
            </button>
            <span
              v-else-if="!appt.isPaidOff && appt.amountDue <= 0"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500"
            >
              Pending
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
        <font-awesome-icon :icon="['fas', 'calendar-day']" class="text-3xl mb-2" />
        <p class="text-sm">No appointments for this date</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted, nextTick } from 'vue';
import { Appointment } from '../../interfaces/Appointment';
import { formatCurrency } from '../../utils/formatCurrency';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faList,
  faStickyNote,
  faCheckCircle,
  faExclamationCircle,
  faCalendarDay,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';

library.add(faList, faStickyNote, faCheckCircle, faExclamationCircle, faCalendarDay, faCreditCard);

export default defineComponent({
  name: 'O2Appointments',
  components: { FontAwesomeIcon },
  props: {
    selectedDate: {
      type: String,
      required: true,
    },
    highlightedSessionId: {
      type: Number,
      default: null,
    },
    refreshKey: {
      type: Number,
      default: 0,
    },
  },
  emits: ['appointments-loaded', 'view-payments', 'pay'],
  setup(props, { emit }) {
    const sessionsHttpClient = new SessionsHttpClient();
    const allAppointments = ref<Appointment[]>([]);
    const activeTab = ref<'all' | 'am' | 'pm'>('all');
    const highlightedEl = ref<HTMLElement | null>(null);

    const determineTime = (app: Appointment): 'AM' | 'PM' => {
      if (app.time) {
        const hour = parseInt(app.time.split(':')[0]);
        return hour < 12 ? 'AM' : 'PM';
      }
      return Math.random() <= 0.5 ? 'AM' : 'PM';
    };

    const fetchAppointments = async (date: string) => {
      try {
        const appointments = await sessionsHttpClient.getSessions(date);
        allAppointments.value = appointments;
        emit('appointments-loaded', appointments);
        if (props.highlightedSessionId) {
          await nextTick();
          highlightedEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
        emit('appointments-loaded', []);
      }
    };

    const amAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'AM')
    );

    const pmAppointments = computed(() =>
      allAppointments.value.filter((a) => determineTime(a) === 'PM')
    );

    const visibleAppointments = computed(() => {
      if (activeTab.value === 'am') return amAppointments.value;
      if (activeTab.value === 'pm') return pmAppointments.value;
      return allAppointments.value;
    });

    const tabs = [
      { key: 'all' as const, label: 'All' },
      { key: 'am' as const, label: 'AM' },
      { key: 'pm' as const, label: 'PM' },
    ];

    onMounted(() => {
      fetchAppointments(props.selectedDate);
    });

    watch(
      () => props.selectedDate,
      (newDate) => {
        fetchAppointments(newDate);
      }
    );

    watch(
      () => props.refreshKey,
      () => {
        fetchAppointments(props.selectedDate);
      }
    );

    return {
      allAppointments,
      amAppointments,
      pmAppointments,
      visibleAppointments,
      activeTab,
      tabs,
      highlightedEl,
      formatCurrency,
    };
  },
});
</script>
