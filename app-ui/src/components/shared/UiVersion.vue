<template>
  <span :class="textClass">UI {{ display }}</span>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'UiVersion',
  props: {
    /** "footer" → just "v89"; "full" → "v89 (5302e97)" */
    mode: {
      type: String as () => 'footer' | 'full',
      default: 'footer',
    },
    textClass: { type: String, default: 'text-gray-400' },
  },
  setup(props) {
    const version = __APP_VERSION__
    const commit = __APP_COMMIT__

    const display = computed(() => {
      const versionPart = version === 'dev' ? 'dev' : `v${version}`
      if (props.mode === 'full') {
        return `${versionPart} (${commit})`
      }
      return versionPart
    })

    return { display }
  },
})
</script>
