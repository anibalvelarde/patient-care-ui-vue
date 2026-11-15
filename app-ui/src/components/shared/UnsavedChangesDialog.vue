<template>
  <!-- WP-64: "Discard changes?" — sits above the drawer (z-[60] > the drawers' z-50).
       Keep editing is the default (focused; Esc and the backdrop also keep editing). -->
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[60] flex items-center justify-center"
      data-testid="unsaved-dialog"
      @keydown.esc.stop="$emit('keep')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('keep')"></div>
      <div
        class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
      >
        <h3 id="unsaved-dialog-title" class="text-lg font-semibold text-slate-800">Discard changes?</h3>
        <p class="text-sm text-slate-600 mt-2">
          {{ message }}
        </p>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            data-testid="unsaved-discard"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            @click="$emit('discard')"
          >
            Discard changes
          </button>
          <button
            ref="keepButton"
            data-testid="unsaved-keep"
            class="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
            @click="$emit('keep')"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue';

export default defineComponent({
  name: 'UnsavedChangesDialog',
  props: {
    visible: { type: Boolean, required: true },
    message: { type: String, default: 'You have unsaved changes. If you leave now, they will be lost.' },
  },
  emits: ['keep', 'discard'],
  setup(props) {
    const keepButton = ref<HTMLButtonElement | null>(null);
    watch(() => props.visible, async (v) => {
      if (v) { await nextTick(); keepButton.value?.focus(); }
    });
    return { keepButton };
  },
});
</script>
