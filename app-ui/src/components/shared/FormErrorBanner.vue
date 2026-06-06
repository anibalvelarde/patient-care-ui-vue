<template>
  <div v-if="message" class="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
    {{ message }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// Shared inline form-error banner — the standard red box used in modal/view footers. Pairs with
// useFormError(): <FormErrorBanner :message="error" />. Renders nothing when message is empty.
export default defineComponent({
  name: 'FormErrorBanner',
  props: {
    message: { type: String, default: '' },
  },
});
</script>
