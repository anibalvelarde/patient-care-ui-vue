<template>
  <!-- WP-65: "a new version is available" — bottom-centre, above page content, below dialogs. -->
  <div
    v-if="visible"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-800 text-white text-sm rounded-xl shadow-lg px-5 py-3"
    role="status"
    data-testid="new-version-banner"
  >
    <span>A new version of the app is available.</span>
    <button
      class="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 font-medium transition-colors"
      data-testid="new-version-reload"
      @click="$emit('reload')"
    >
      Reload
    </button>
    <button
      class="text-slate-300 hover:text-white transition-colors"
      title="Remind me later"
      aria-label="Remind me later"
      data-testid="new-version-dismiss"
      @click="$emit('dismiss')"
    >
      Later
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NewVersionBanner',
  props: { visible: { type: Boolean, required: true } },
  emits: ['reload', 'dismiss'],
});
</script>
