<template>
  <router-view />
  <GlobalErrorToast />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GlobalErrorToast from './components/shared/GlobalErrorToast.vue';

export default defineComponent({
  name: 'App',
  components: { GlobalErrorToast },
});
</script>
