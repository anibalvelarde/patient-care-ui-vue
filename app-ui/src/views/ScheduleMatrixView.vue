<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O2MobileNav />
    <div class="flex flex-1">
      <O2Sidebar />
      <div class="flex-1 flex flex-col min-h-screen min-w-0">
        <O2Header />
        <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <!-- Header -->
          <div class="mb-5">
            <h1 class="text-2xl font-bold text-slate-800">Weekly Schedule</h1>
            <p class="text-sm text-slate-500 mt-1">Therapist availability and appointments by site</p>
          </div>

          <!-- Controls -->
          <div class="flex flex-wrap items-center gap-3 mb-5">
            <!-- Site selector -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-600">Site:</label>
              <select
                v-model="selectedSiteId"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option v-if="sites.length === 0" :value="0" disabled>Loading...</option>
                <option v-for="site in sites" :key="site.siteId" :value="site.siteId">
                  {{ site.siteName }}
                </option>
              </select>
            </div>

            <!-- Week navigation -->
            <div class="flex items-center gap-1">
              <button
                @click="prevWeek"
                class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Previous week"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <input
                type="date"
                v-model="selectedDate"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                @click="nextWeek"
                class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Next week"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                @click="goToday"
                class="ml-1 px-2 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            <!-- Week range display -->
            <span v-if="matrix" class="text-xs text-slate-400">
              {{ matrix.weekStart }} &mdash; {{ matrix.weekEnd }} &middot; {{ matrix.siteName }}
            </span>
          </div>

          <!-- Matrix -->
          <ScheduleMatrix
            :matrix="matrix"
            :loading="loading"
            @book="onBook"
            @view="onView"
          />

          <!-- Error -->
          <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {{ error }}
          </div>
        </main>
        <O2Footer />
      </div>
    </div>

    <!-- Booking modal -->
    <BookingFormModal
      :visible="bookingVisible"
      @close="bookingVisible = false"
      @saved="onBookingSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import O2MobileNav from '../components/option02/O2MobileNav.vue';
import O2Sidebar from '../components/option02/O2Sidebar.vue';
import O2Header from '../components/option02/O2Header.vue';
import O2Footer from '../components/option02/O2Footer.vue';
import ScheduleMatrix from '../components/schedule/ScheduleMatrix.vue';
import BookingFormModal from '../components/appointments/BookingFormModal.vue';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
import { SitesHttpClient } from '../services/SitesHttpClient';
import type { ScheduleMatrixResponse } from '../interfaces/ScheduleMatrix';
import type { Site } from '../interfaces/Site';

export default defineComponent({
  name: 'ScheduleMatrixView',
  components: { O2MobileNav, O2Sidebar, O2Header, O2Footer, ScheduleMatrix, BookingFormModal },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const sessionsClient = new SessionsHttpClient();
    const sitesClient = new SitesHttpClient();

    const today = new Date().toISOString().split('T')[0];
    const initialDate = (route.query.date as string) || today;
    const initialSiteId = route.query.siteId ? Number(route.query.siteId) : 0;
    const selectedDate = ref(initialDate);
    const selectedSiteId = ref(initialSiteId);
    const sites = ref<Site[]>([]);
    const matrix = ref<ScheduleMatrixResponse | null>(null);
    const loading = ref(false);
    const error = ref('');

    // Booking modal state
    const bookingVisible = ref(false);

    const loadSites = async () => {
      try {
        sites.value = await sitesClient.getSites();
        if (sites.value.length > 0 && selectedSiteId.value === 0) {
          selectedSiteId.value = sites.value[0].siteId;
        }
      } catch {
        sites.value = [];
      }
    };

    const loadMatrix = async () => {
      if (!selectedSiteId.value || !selectedDate.value) return;
      loading.value = true;
      error.value = '';
      try {
        matrix.value = await sessionsClient.getScheduleMatrix(selectedDate.value, selectedSiteId.value);
      } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Failed to load schedule matrix.';
        matrix.value = null;
      } finally {
        loading.value = false;
      }
    };

    const prevWeek = () => {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() - 7);
      selectedDate.value = d.toISOString().split('T')[0];
    };

    const nextWeek = () => {
      const d = new Date(selectedDate.value);
      d.setDate(d.getDate() + 7);
      selectedDate.value = d.toISOString().split('T')[0];
    };

    const goToday = () => {
      selectedDate.value = new Date().toISOString().split('T')[0];
    };

    const onBook = () => {
      bookingVisible.value = true;
    };

    const onView = (sessionId: number, date: string) => {
      const returnUrl = `/schedule?date=${selectedDate.value}&siteId=${selectedSiteId.value}`;
      router.push({ path: '/', query: { date, highlightSession: String(sessionId), from: returnUrl } });
    };

    const onBookingSaved = () => {
      bookingVisible.value = false;
      loadMatrix();
    };

    watch(selectedDate, () => loadMatrix());
    watch(selectedSiteId, () => loadMatrix());

    onMounted(async () => {
      await loadSites();
      await loadMatrix();
    });

    return {
      selectedDate,
      selectedSiteId,
      sites,
      matrix,
      loading,
      error,
      prevWeek,
      nextWeek,
      goToday,
      onBook,
      onView,
      bookingVisible,
      onBookingSaved,
    };
  },
});
</script>
