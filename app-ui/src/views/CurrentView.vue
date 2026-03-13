<template>
  <div id="current-app" class="flex flex-col min-h-screen font-sans">
    <Sidebar class="flex-shrink-0" />
    <div class="main-content flex-grow p-4">
      <Header class="mb-4" />
      <Calendar class="mb-4" :selectedDate="selectedDate" @date-selected="updateSelectedDate" />
      <Appointments class="mb-4" :selectedDate="selectedDate" />
    </div>
    <Footer class="flex-shrink-0" />
    <router-link
      to="/design-options"
      class="fixed top-4 right-4 z-50 bg-white text-gray-700 border border-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-gray-50 transition-colors"
    >
      &larr; Back to Options
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Sidebar from '../components/sidebars/SidebarSection.vue';
import Header from '../components/headers/HeaderSection.vue';
import Calendar from '../components/calendars/CalendarSection.vue';
import Appointments from '../components/appointments/AppointmentsSection.vue';
import Footer from '../components/footers/FooterSection.vue';

export default defineComponent({
  name: 'CurrentView',
  components: {
    Sidebar,
    Header,
    Calendar,
    Appointments,
    Footer,
  },
  setup() {
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    return {
      selectedDate,
      updateSelectedDate,
    };
  },
});
</script>

<style scoped>
#current-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: monospace;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  font-family: monospace;
}

@media (min-width: 768px) {
  #current-app {
    flex-direction: row;
  }

  .main-content {
    padding: 40px;
  }
}

@media (max-width: 767px) {
  .main-content {
    padding: 10px;
  }
}
</style>
