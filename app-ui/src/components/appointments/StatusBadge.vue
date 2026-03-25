<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeClass,
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', dotClass]"></span>
    {{ label }}
  </span>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { getStatusBadgeClass, getStatusLabel, getStatusDotColor } from '../../utils/statusHelpers';

export default defineComponent({
  name: 'StatusBadge',
  props: {
    statusId: { type: Number, required: true },
    statusName: { type: String, required: true },
  },
  setup(props) {
    const badgeClass = computed(() => getStatusBadgeClass(props.statusId));
    const label = computed(() => getStatusLabel(props.statusName));
    const dotClass = computed(() => getStatusDotColor(props.statusId));
    return { badgeClass, label, dotClass };
  },
});
</script>
