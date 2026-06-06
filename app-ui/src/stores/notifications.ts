// stores/notifications.ts
//
// App-level transient notifications (toasts) for errors/messages that aren't tied to a single form —
// e.g. "your session has expired" on logout, or background failures. Form-field errors stay local
// via useFormError(); this store is for cross-cutting, ephemeral messages surfaced by <GlobalErrorToast>.

import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationKind = 'error' | 'success' | 'info';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  message: string;
}

const DEFAULT_DURATION_MS = 6000;

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([]);
  let nextId = 0;

  /** Add a notification; auto-dismisses after durationMs (pass 0 to make it sticky). Returns its id. */
  function push(kind: NotificationKind, message: string, durationMs: number = DEFAULT_DURATION_MS): number {
    const id = ++nextId;
    items.value.push({ id, kind, message });
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
    return id;
  }

  function error(message: string, durationMs?: number): number {
    return push('error', message, durationMs);
  }
  function success(message: string, durationMs?: number): number {
    return push('success', message, durationMs);
  }
  function info(message: string, durationMs?: number): number {
    return push('info', message, durationMs);
  }

  function dismiss(id: number): void {
    items.value = items.value.filter((n) => n.id !== id);
  }

  function clear(): void {
    items.value = [];
  }

  return { items, push, error, success, info, dismiss, clear };
});
