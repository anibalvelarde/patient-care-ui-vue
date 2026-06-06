// composables/useModalForm.ts
//
// Shared form-modal plumbing (Chunk 6). Wraps useFormError (Chunk 3B) plus the `saving` flag and the
// repetitive submit flow that every form modal had:
//   saving=true → clear error → try { ...save... } catch → setFromException → finally saving=false
//
// Usage:
//   const { error, hasError, saving, setError, clearError, submit } = useModalForm();
//   const handleSubmit = () => {
//     if (!valid) { setError('Please fill in all required fields.'); return; }   // validate first
//     return submit(async () => {
//       await client.save(...);           // static-imported client
//       emit('saved'); emit('close');
//     });
//   };
// Pair with <FormErrorBanner :message="error" /> and :disabled="saving || hasError".

import { ref } from 'vue';
import { useFormError } from './useFormError';

export function useModalForm() {
  const { message: error, hasError, setError, setFromException, clear } = useFormError();
  const saving = ref(false);

  /** Run a save action inside the standard modal flow. Re-entrant calls while saving are ignored. */
  async function submit(action: () => Promise<void>, fallback = 'An error occurred while saving.'): Promise<void> {
    if (saving.value) return;
    clear();
    saving.value = true;
    try {
      await action();
    } catch (e) {
      setFromException(e, fallback);
    } finally {
      saving.value = false;
    }
  }

  return { error, hasError, saving, setError, clearError: clear, submit };
}
