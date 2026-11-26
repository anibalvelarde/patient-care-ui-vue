<template>
  <!-- WP-51: in the page flow (sticky, not fixed) so it pushes the header down instead of covering it. -->
  <MaintenanceBanner
    :visible="maintenanceBannerVisible"
    :admin-view="auth.isAuthenticated"
    :message="maintenance.message"
  />
  <router-view />
  <GlobalErrorToast />
  <IdleWarningModal
    :visible="warningVisible"
    :seconds-remaining="secondsRemaining"
    @stay="stayActive"
    @signout="signOutNow"
  />
  <NewVersionBanner :visible="bannerVisible" @reload="reload" @dismiss="dismiss" />
  <MaintenanceLockout :visible="lockoutVisible" :message="maintenance.message" @logout="logoutFromLockout" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import GlobalErrorToast from './components/shared/GlobalErrorToast.vue';
import IdleWarningModal from './components/shared/IdleWarningModal.vue';
import { useIdleLogoff } from './composables/useIdleLogoff';
import NewVersionBanner from './components/shared/NewVersionBanner.vue';
import { useNewVersionCheck } from './composables/useNewVersionCheck';
import MaintenanceBanner from './components/shared/MaintenanceBanner.vue';
import MaintenanceLockout from './components/shared/MaintenanceLockout.vue';
import { useMaintenanceMode } from './composables/useMaintenanceMode';
import { useAuthStore } from './stores/auth';

export default defineComponent({
  name: 'App',
  components: { GlobalErrorToast, IdleWarningModal, NewVersionBanner, MaintenanceBanner, MaintenanceLockout },
  setup() {
    // WP-32 (U4): arm the idle auto-logoff watcher at the app root. It self-disarms whenever the
    // user isn't authenticated or the site's timeout is 0, so it's safe to mount unconditionally.
    const { warningVisible, secondsRemaining, stayActive, signOutNow } = useIdleLogoff();
    // WP-65: hourly "is a newer build deployed?" check → dismissable Reload banner (off in dev).
    const { bannerVisible, reload, dismiss } = useNewVersionCheck();

    // WP-51: maintenance valve (edge flag, checked every minute). Non-SYSADMIN users are locked
    // out; SYSADMIN works through it under a banner; the login page stays reachable.
    const auth = useAuthStore();
    const router = useRouter();
    const { maintenance: maintenanceRef } = useMaintenanceMode();
    const maintenance = computed(() => maintenanceRef.value);
    const lockoutVisible = computed(
      () => maintenance.value.enabled && auth.isAuthenticated && !auth.isSystemAdmin,
    );
    const maintenanceBannerVisible = computed(
      () => maintenance.value.enabled && (auth.isSystemAdmin || !auth.isAuthenticated),
    );
    function logoutFromLockout(): void {
      auth.logout();
      void router.push({ name: 'login' });
    }

    return {
      warningVisible, secondsRemaining, stayActive, signOutNow, bannerVisible, reload, dismiss,
      auth, maintenance, lockoutVisible, maintenanceBannerVisible, logoutFromLockout,
    };
  },
});
</script>
