<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="px-6 py-3 flex items-center justify-between">
      <p class="text-[10px] text-gray-400">
        &copy; {{ currentYear }} Neurocorp Therapy Center
      </p>
      <router-link
        to="/"
        class="text-[10px] text-violet-500 hover:text-violet-700 font-medium transition-colors md:hidden"
      >
        &larr; Back to Options
      </router-link>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'O2Footer',
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
