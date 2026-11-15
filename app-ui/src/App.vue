<template>
  <router-view />
  <GlobalErrorToast />
  <IdleWarningModal
    :visible="warningVisible"
    :seconds-remaining="secondsRemaining"
    @stay="stayActive"
    @signout="signOutNow"
  />
  <NewVersionBanner :visible="bannerVisible" @reload="reload" @dismiss="dismiss" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GlobalErrorToast from './components/shared/GlobalErrorToast.vue';
import IdleWarningModal from './components/shared/IdleWarningModal.vue';
import { useIdleLogoff } from './composables/useIdleLogoff';
import NewVersionBanner from './components/shared/NewVersionBanner.vue';
import { useNewVersionCheck } from './composables/useNewVersionCheck';

export default defineComponent({
  name: 'App',
  components: { GlobalErrorToast, IdleWarningModal, NewVersionBanner },
  setup() {
    // WP-32 (U4): arm the idle auto-logoff watcher at the app root. It self-disarms whenever the
    // user isn't authenticated or the site's timeout is 0, so it's safe to mount unconditionally.
    const { warningVisible, secondsRemaining, stayActive, signOutNow } = useIdleLogoff();
    // WP-65: hourly "is a newer build deployed?" check → dismissable Reload banner (off in dev).
    const { bannerVisible, reload, dismiss } = useNewVersionCheck();
    return { warningVisible, secondsRemaining, stayActive, signOutNow, bannerVisible, reload, dismiss };
  },
});
</script>
