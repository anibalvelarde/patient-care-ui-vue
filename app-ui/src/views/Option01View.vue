<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <O1Navbar />
    <O1ActionBar />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column: Calendar -->
        <div class="lg:col-span-1">
          <O1Calendar
            :selectedDate="selectedDate"
            @date-selected="updateSelectedDate"
          />
        </div>
        <!-- Right column: Appointments -->
        <div class="lg:col-span-2">
          <O1Appointments :selectedDate="selectedDate" />
        </div>
      </div>
    </main>
    <O1Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import O1Navbar from '../components/option01/O1Navbar.vue';
import O1ActionBar from '../components/option01/O1ActionBar.vue';
import O1Calendar from '../components/option01/O1Calendar.vue';
import O1Appointments from '../components/option01/O1Appointments.vue';
import O1Footer from '../components/option01/O1Footer.vue';

export default defineComponent({
  name: 'Option01View',
  components: {
    O1Navbar,
    O1ActionBar,
    O1Calendar,
    O1Appointments,
    O1Footer,
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
