<template>
  <!-- WP-51: persistent (not dismissable) top bar while the maintenance valve is on.
       SYSADMIN sees it while working through the bypass; signed-out users see it on the login
       page so staff understand why their sign-in will be locked. -->
  <div
    v-if="visible"
    class="sticky top-0 z-[45] bg-red-600 text-white text-sm text-center px-4 py-1.5 shadow"
    role="status"
    data-testid="maintenance-banner"
  >
    <span class="font-semibold">{{ adminView ? 'Maintenance mode is ON.' : 'Maintenance in progress.' }}</span>
    {{ adminView
      ? ' Only system administrators can work; everyone else is locked out.'
      : ' Only the system administrator can sign in right now.' }}
    <span v-if="message" class="opacity-90" data-testid="maintenance-banner-message">— {{ message }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MaintenanceBanner',
  props: {
    visible: { type: Boolean, required: true },
    /** true = SYSADMIN working through the bypass; false = signed-out user (login page). */
    adminView: { type: Boolean, default: false },
    message: { type: String, default: '' },
  },
});
</script>
