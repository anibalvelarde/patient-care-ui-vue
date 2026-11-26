<template>
  <!-- WP-51: full-screen lockout for everyone but SYSADMIN while the maintenance valve is on.
       Sits below the idle-logoff dialog (z-60) so its countdown stays usable. No dismiss. -->
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[55] flex items-center justify-center bg-slate-100 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="maintenance-lockout-title"
      data-testid="maintenance-lockout"
    >
      <div class="w-full max-w-md rounded-xl bg-white shadow-2xl p-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg class="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 id="maintenance-lockout-title" class="text-lg font-semibold text-slate-800">
          The system is under maintenance
        </h2>
        <p class="mt-2 text-sm text-slate-600">
          Please don't enter any data for now. Anything entered during maintenance could be lost.
        </p>
        <p
          v-if="message"
          class="mt-4 whitespace-pre-line rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
          data-testid="maintenance-lockout-message"
        >{{ message }}</p>
        <p class="mt-4 text-xs text-slate-500">
          This page checks again every minute and unlocks by itself when maintenance ends.
        </p>
        <button
          class="mt-6 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
          data-testid="maintenance-lockout-logout"
          @click="$emit('logout')"
        >
          Sign out
        </button>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MaintenanceLockout',
  props: {
    visible: { type: Boolean, required: true },
    message: { type: String, default: '' },
  },
  emits: ['logout'],
});
</script>
