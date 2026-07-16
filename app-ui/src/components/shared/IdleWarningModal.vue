<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
    >
      <!-- Backdrop (no click-to-dismiss: the choice must be explicit) -->
      <div class="absolute inset-0 bg-black/40"></div>

      <!-- Card -->
      <div
        data-testid="idle-warning-modal"
        class="relative w-full max-w-sm rounded-xl bg-white shadow-2xl p-6 text-center"
      >
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
        </div>

        <h2 id="idle-warning-title" class="text-lg font-semibold text-slate-800">
          Still there?
        </h2>
        <p class="mt-2 text-sm text-slate-600">
          You'll be signed out in
          <span data-testid="idle-countdown" class="font-semibold text-slate-900">
            {{ secondsRemaining }}
          </span>
          second<span v-if="secondsRemaining !== 1">s</span> due to inactivity.
        </p>

        <div class="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            data-testid="idle-signout-button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
            @click="$emit('signout')"
          >
            Sign out now
          </button>
          <button
            type="button"
            data-testid="idle-stay-button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            @click="$emit('stay')"
          >
            I'm still here
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// WP-32 (U4): the idle-logoff countdown. State/timing lives in useIdleLogoff; this component is
// purely presentational — it renders the remaining seconds and emits the user's choice.
export default defineComponent({
  name: 'IdleWarningModal',
  props: {
    visible: { type: Boolean, required: true },
    secondsRemaining: { type: Number, default: 0 },
  },
  emits: ['stay', 'signout'],
});
</script>
