<template>
  <div class="fixed top-4 right-4 z-[100] w-80 max-w-[90vw] space-y-2">
    <transition-group name="toast">
      <div
        v-for="n in items"
        :key="n.id"
        :class="['flex items-start gap-2 rounded-lg px-4 py-3 text-sm shadow-md', kindClass(n.kind)]"
        role="alert"
      >
        <span class="flex-1">{{ n.message }}</span>
        <button
          class="shrink-0 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
          @click="dismiss(n.id)"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationsStore, type NotificationKind } from '../../stores/notifications';

// Mounted once in App.vue. Renders the notifications store as stacked, auto-dismissing toasts.
export default defineComponent({
  name: 'GlobalErrorToast',
  setup() {
    const store = useNotificationsStore();
    const { items } = storeToRefs(store);

    const kindClass = (kind: NotificationKind): string => {
      switch (kind) {
        case 'success':
          return 'bg-green-600 text-white';
        case 'info':
          return 'bg-slate-800 text-white';
        case 'error':
        default:
          return 'bg-red-600 text-white';
      }
    };

    return { items, dismiss: store.dismiss, kindClass };
  },
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
