import { defineComponent, ref, onMounted, watch } from 'vue';
import AppointmentList from './AppointmentList.vue';
import { SessionsHttpClient } from '../../services/SessionsHttpClient';
import { Appointment } from '../../interfaces/Appointment';

export default defineComponent({
  name: 'Appointments',
  props: {
    selectedDate: {
      type: String,
      required: true
    }
  },
  components: {
    AppointmentList
  },
  setup(props) {
    const sessionsHttpClient = new SessionsHttpClient();

    const amAppointments = ref<Appointment[]>([]);
    const pmAppointments = ref<Appointment[]>([]);

    const fetchAppointments = async (date: string) => {
      try {
        const appointments = await sessionsHttpClient.getSessions(date);

        // Filter AM appointments
        const amApps = appointments.filter((app: Appointment) => determineTime(app) === 'AM');
        // Filter PM appointments, excluding those already in AM appointments
        const pmApps = appointments.filter((app: Appointment) => determineTime(app) === 'PM' && !amApps.some(amApp => amApp.sessionId === app.sessionId));

        // Assign filtered appointments to the respective ref arrays
        amAppointments.value = amApps;
        pmAppointments.value = pmApps;
      } catch {
        console.error("Error fetching appointments.");
      }
    };

    const determineTime = (app: Appointment): 'AM' | 'PM' => {
      if (app.time) {
        const hour = parseInt(app.time.split(":")[0]);
        return hour < 12 ? 'AM' : 'PM';
      } else {
        const randomValue = Math.random();
        return randomValue <= 0.5 ? 'AM' : 'PM';
      }
    };

    onMounted(() => {
      fetchAppointments(props.selectedDate);
    });

    watch(() => props.selectedDate, (newDate) => {
      fetchAppointments(newDate);
    });

    return {
      amAppointments,
      pmAppointments
    };
  }
});
