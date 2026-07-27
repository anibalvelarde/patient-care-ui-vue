<template>
  <!-- Renders nothing when the session carries no notes — the icon only appears when there is
       something to reveal (WP-35 ruling G2). -->
  <span v-if="hasNotes" ref="root" class="relative inline-flex" @mouseenter="onEnter" @mouseleave="onLeave">
    <button
      ref="trigger"
      type="button"
      data-testid="notes-button"
      class="p-1 rounded-lg text-slate-300 hover:text-violet-500 hover:bg-violet-50 transition-colors"
      :aria-expanded="open"
      aria-label="Session notes"
      title="Session notes"
      @click.prevent.stop="toggle"
    >
      <font-awesome-icon :icon="['fas', 'sticky-note']" class="text-xs" />
    </button>

    <!-- Teleported to body + fixed-positioned so table overflow clipping never cuts it off
         (same approach as WP-31's AuditPopover — tap-toggle for touch, delayed hover-open on
         desktop, Escape/outside-click close). Content is static, so the teleport-stub remount
         gotcha doesn't apply. -->
    <teleport to="body">
      <div
        v-if="open"
        data-testid="notes-popover"
        class="fixed z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl"
        :style="popoverStyle"
        role="dialog"
        aria-label="Session notes"
      >
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Session notes</p>
        <!-- Full content, no truncation (ruling G2); long notes scroll inside the card. -->
        <p
          data-testid="notes-content"
          class="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700"
        >{{ notes }}</p>
      </div>
    </teleport>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, reactive, ref, type PropType } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faStickyNote);

const HOVER_OPEN_DELAY_MS = 350;
const GAP_PX = 6;
const POPOVER_WIDTH_PX = 288; // matches w-72
const EST_HEIGHT_PX = 140;

// WP-35 (SH-2): a tappable sticky-note icon that reveals a session's full notes. Mirrors the
// Dashboard › Appointments notes tooltip (O2Appointments) but is tap-friendly — hover-only
// tooltips are invisible on touch (same lesson as the WP-31 AuditPopover, whose open/close
// mechanics this reuses). Click/tap is prevented+stopped so a trigger inside a router-link row
// never navigates.
export default defineComponent({
  name: 'NotesPopover',
  components: { FontAwesomeIcon },
  props: {
    notes: { type: String as PropType<string | null | undefined>, default: null },
  },
  setup(props) {
    const root = ref<HTMLElement | null>(null);
    const trigger = ref<HTMLElement | null>(null);
    const open = ref(false);
    const pinned = ref(false); // a tap pins it open so a passing mouseleave doesn't dismiss
    const popoverStyle = reactive<Record<string, string>>({ top: '0px', left: '0px' });
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;

    const hasNotes = computed(() => !!props.notes && props.notes.trim().length > 0);

    function position() {
      const el = trigger.value;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      // Right-aligned to the trigger; clamp into the viewport.
      let left = r.right - POPOVER_WIDTH_PX;
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

    onBeforeUnmount(removeGlobalListeners);

    return { root, trigger, open, hasNotes, popoverStyle, toggle, onEnter, onLeave };
  },
});
</script>
