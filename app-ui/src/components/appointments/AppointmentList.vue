<template>
  <div class="appointment-list">
    <h3>{{ title }}</h3>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Patient</th>
          <th>Therapy</th>
          <th>Therapist</th>
          <th>Provider</th>
          <th>Notes</th>
          <th>Paid Off?</th>
          <th>Past Due?</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appointment in appointments" :key="appointment.sessionId" :class="{ pastDue: appointment.isPastDue }">
          <td>{{ appointment.time }}</td>
          <td>{{ appointment.patient }}</td>
          <td>{{ appointment.therapyTypes }}</td>
          <td>{{ appointment.therapist }}</td>
          <td>${{ appointment.providerAmount.toFixed(2) }}</td>
          <td>{{ appointment.notes }}</td>
          <td>
            <font-awesome-icon 
              :icon="['fas', 'file-invoice-dollar']" 
              :class="{
                'paid-off': appointment.isPaidOff, 
                'not-paid-off': !appointment.isPaidOff && !appointment.isPastDue,
                'past-due': !appointment.isPaidOff && appointment.isPastDue
              }"
            />
          </td>
          <td>
            <font-awesome-icon 
              v-if="appointment.isPastDue" 
              :icon="['fas', 'exclamation-circle']" 
              class="past-due-icon"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" src="./AppointmentList.ts"></script>

<style scoped src="./AppointmentList.css"></style>
