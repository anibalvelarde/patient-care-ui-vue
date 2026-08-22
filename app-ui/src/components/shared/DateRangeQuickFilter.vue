<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
      <button
        v-for="opt in presets"
        :key="opt.key"
        type="button"
        class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        :class="preset === opt.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        :data-testid="`range-preset-${opt.key}`"
        @click="selectPreset(opt.key)"
      >
        {{ opt.label }}
      </button>
    </div>

    <template v-if="preset === 'custom'">
      <input
        v-model="customFrom"
        type="date"
        class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        data-testid="range-from"
        @change="emitCustom"
      />
      <span class="text-slate-400 text-sm">→</span>
      <input
        v-model="customTo"
        type="date"
        class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        data-testid="range-to"
        @change="emitCustom"
      />
    </template>

    <span class="inline-flex items-center gap-1 text-xs text-slate-400">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      your local time · {{ tzName }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import {
  presetBounds, customBounds, observerTimeZoneName,
  type RangePreset, type UtcRange,
} from '../../utils/observerTime';

export interface RangeChange extends UtcRange {
  preset: RangePreset;
}

export default defineComponent({
  name: 'DateRangeQuickFilter',
  emits: ['change'],
  setup(_props, { emit }) {
    const preset = ref<RangePreset>('today');
    const customFrom = ref('');
    const customTo = ref('');
    const tzName = observerTimeZoneName();

    const presets = [
      { key: 'today' as const, label: 'Today' },
      { key: 'yesterday' as const, label: 'Yesterday' },
      { key: 'last7' as const, label: 'Last 7 days' },
      { key: 'last30' as const, label: 'Last 30 days' },
      { key: 'custom' as const, label: 'Custom' },
    ];

    function selectPreset(key: RangePreset): void {
      preset.value = key;
      if (key === 'custom') {
        emitCustom();
        return;
      }
      const bounds = presetBounds(key);
      emit('change', { preset: key, ...bounds } as RangeChange);
    }

    function emitCustom(): void {
      const bounds = customBounds(customFrom.value, customTo.value);
      if (bounds) {
        emit('change', { preset: 'custom', ...bounds } as RangeChange);
      }
    }

    onMounted(() => selectPreset('today'));

    return { preset, customFrom, customTo, tzName, presets, selectPreset, emitCustom };
  },
});
</script>
