import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CalendarDayCard',
  props: {
    day: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    isToday: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    selectDay() {
      this.$emit('select-day', this.date);
    }
  }
});
