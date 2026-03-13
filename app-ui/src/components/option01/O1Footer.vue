<template>
  <footer class="bg-white border-t border-slate-200 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
      <p class="text-xs text-slate-400">
        &copy; {{ currentYear }} Neurocorp Therapy Center. All rights reserved.
      </p>
      <router-link
        to="/design-options"
        class="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
      >
        Design Options
      </router-link>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'O1Footer',
  setup() {
    const currentYear = new Date().getFullYear();
    return { currentYear };
  },
});
</script>
