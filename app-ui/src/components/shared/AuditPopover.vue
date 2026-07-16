<template>
  <!-- Renders nothing when the API didn't send an audit block (older deployment). -->
  <span v-if="audit" ref="root" class="relative inline-flex" @mouseenter="onEnter" @mouseleave="onLeave">
    <button
      ref="trigger"
      type="button"
      data-testid="audit-info-button"
      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      :aria-expanded="open"
      aria-label="Record history"
      title="Record history"
      @click="toggle"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    <!-- Teleported to body + fixed-positioned so the table's overflow clipping never cuts it off.
         The content is static (no local state), so the teleport-stub remount gotcha doesn't apply. -->
    <teleport to="body">
      <div
        v-if="open"
        ref="popover"
        data-testid="audit-info-popover"
        class="fixed z-50 w-60 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl"
        :style="popoverStyle"
        role="dialog"
        aria-label="Record history"
      >
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Record history</p>
        <dl class="space-y-1.5 text-xs">
          <div class="flex justify-between gap-3">
            <dt class="text-slate-500">Created</dt>
            <dd class="text-right text-slate-700" data-testid="audit-created">{{ formatDateTime(audit.createdAt) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-slate-500">Last updated</dt>
            <dd class="text-right text-slate-700" data-testid="audit-updated">{{ formatDateTime(audit.updatedAt) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-slate-500">Last updated by</dt>
            <dd class="text-right font-medium text-slate-800" data-testid="audit-updated-by">{{ audit.updatedBy }}</dd>
          </div>
        </dl>
      </div>
    </teleport>
  </span>
</template>

<script lang="ts">
import { defineComponent, nextTick, onBeforeUnmount, reactive, ref, type PropType } from 'vue';
import type { AuditInfo } from '../../interfaces/Audit';

const HOVER_OPEN_DELAY_MS = 350;
const GAP_PX = 6;
const POPOVER_WIDTH_PX = 240; // matches w-60
const EST_HEIGHT_PX = 120;

// WP-31 (U1): a tappable ⓘ that reveals a record's created / last-updated / updated-by. Tap-toggle
// (mobile-first) plus a delayed hover-open on desktop; Escape and outside-click close it. Hidden
// entirely when no audit block is present, so it degrades cleanly against an older API.
export default defineComponent({
  name: 'AuditPopover',
  props: {
    audit: { type: Object as PropType<AuditInfo | null | undefined>, default: null },
    align: { type: String as PropType<'left' | 'right'>, default: 'right' },
  },
  setup(props) {
    const root = ref<HTMLElement | null>(null);
    const trigger = ref<HTMLElement | null>(null);
    const open = ref(false);
    const pinned = ref(false); // a click pins it open so a passing mouseleave doesn't dismiss
    const popoverStyle = reactive<Record<string, string>>({ top: '0px', left: '0px' });
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;

    function position() {
      const el = trigger.value;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      // Right-aligned to the trigger by default; clamp into the viewport.
      let left = props.align === 'left' ? r.left : r.right - POPOVER_WIDTH_PX;
      left = Math.max(8, Math.min(left, vw - POPOVER_WIDTH_PX - 8));
      // Below the trigger, or above if it would overflow the bottom.
      const top = r.bottom + EST_HEIGHT_PX + GAP_PX > vh ? r.top - EST_HEIGHT_PX - GAP_PX : r.bottom + GAP_PX;
      popoverStyle.left = `${Math.round(left)}px`;
      popoverStyle.top = `${Math.round(Math.max(8, top))}px`;
    }

    function onDocPointer(e: Event) {
      const target = e.target as Node;
      if (root.value?.contains(target)) return;
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    function addGlobalListeners() {
      document.addEventListener('pointerdown', onDocPointer, true);
      document.addEventListener('keydown', onKey);
    }
    function removeGlobalListeners() {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey);
    }

    function show() {
      if (open.value) return;
      position();
      open.value = true;
      addGlobalListeners();
      void nextTick(position); // refine once the element exists
    }
    function close() {
      open.value = false;
      pinned.value = false;
      if (hoverTimer) clearTimeout(hoverTimer);
      removeGlobalListeners();
    }
    function toggle() {
      if (open.value) {
        close();
      } else {
        pinned.value = true;
        show();
      }
    }
    function onEnter() {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(show, HOVER_OPEN_DELAY_MS);
    }
    function onLeave() {
      if (hoverTimer) clearTimeout(hoverTimer);
      if (!pinned.value) close();
    }

    function formatDateTime(value: string): string {
      if (!value) return '—';
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    }

    onBeforeUnmount(removeGlobalListeners);

    return { root, trigger, open, popoverStyle, toggle, onEnter, onLeave, formatDateTime };
  },
});
</script>
