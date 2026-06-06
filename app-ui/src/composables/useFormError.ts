// composables/useFormError.ts
//
// Centralizes the per-form error pattern that was duplicated across ~35 views and modals:
//   const error = ref('')
//   try { ... } catch (e) { error.value = e instanceof Error ? e.message : 'fallback' }
//   <div v-if="error" class="...red banner...">{{ error }}</div>
//   :disabled="saving || !!error"
//
// Error state stays LOCAL to each form (two open modals must not share one error). This only
// removes the boilerplate. Pair with <FormErrorBanner :message="error" /> for the display.
// API messages already arrive as Error.message (HttpClientBase surfaces ProblemDetails detail/title
// from Chunk 3A), so setFromException just needs the Error→string + fallback handling.

import { computed, ref } from 'vue';

export function useFormError() {
  const message = ref('');
  const hasError = computed(() => message.value.length > 0);

  /** Set an explicit, app-authored message (e.g. client-side validation). */
  function setError(text: string): void {
    message.value = text;
  }

  /** Set the message from a caught error, falling back when it isn't an Error. */
  function setFromException(error: unknown, fallback = 'An unexpected error occurred.'): void {
    message.value = error instanceof Error && error.message ? error.message : fallback;
  }

  function clear(): void {
    message.value = '';
  }

  return { message, hasError, setError, setFromException, clear };
}
