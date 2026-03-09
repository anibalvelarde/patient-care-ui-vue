# Adding a New UI Design Option

## When to Use
When creating a new design option for the UI comparison framework.

## Steps

### 1. Create Component Directory

```bash
mkdir app-ui/src/components/option0X/
```

### 2. Create Components

At minimum, create these components (replace `X` with your option number):

- `O{X}Header.vue` — Top bar with date nav, JumpToDate, role badge, "Back to Options" link
- Calendar/date selection component (week strip, month grid, pills, etc.)
- Appointment display component(s) (table, cards, list, lanes, etc.)

**Header pattern** — every header should include:
```vue
<JumpToDate
  buttonClass="..."
  jumpButtonClass="..."
  @jump="(date: string) => $emit('date-selected', date)"
/>
```

```vue
<router-link to="/" class="...">
  <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-0.5" />
  Options
</router-link>
```

### 3. Create View

Create `app-ui/src/views/Option0XView.vue` following this pattern:

```vue
<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { Appointment } from '../interfaces/Appointment';
import { SessionsHttpClient } from '../services/SessionsHttpClient';
// import your components...

export default defineComponent({
  name: 'Option0XView',
  components: { /* ... */ },
  setup() {
    const sessionsHttpClient = new SessionsHttpClient();
    const selectedDate = ref<string>(new Date().toLocaleDateString('en-US'));
    const allAppointments = ref<Appointment[]>([]);

    const fetchAppointments = async (date: string) => {
      try {
        allAppointments.value = await sessionsHttpClient.getSessions(date);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        allAppointments.value = [];
      }
    };

    const updateSelectedDate = (date: string) => {
      selectedDate.value = date;
    };

    onMounted(() => fetchAppointments(selectedDate.value));
    watch(selectedDate, (newDate) => fetchAppointments(newDate));

    return { selectedDate, allAppointments, updateSelectedDate };
  },
});
</script>
```

### 4. Register Route

Add to `app-ui/src/router/index.ts`:

```typescript
{
  path: '/option-0X',
  name: 'option-0X',
  component: () => import('../views/Option0XView.vue'),
},
```

### 5. Add Comparison Card

Add a `<router-link>` card to `app-ui/src/views/CompareView.vue` following the existing pattern.

### 6. Update Documentation

Update `UI-DESIGN-IDEAS.md`:
- Move the option from "Proposed" to "Already Built" table
- Add `--- BUILT as Option 0X` annotation to the proposed section

### 7. Verify

```bash
cd app-ui
npx vue-tsc --noEmit   # Must pass
npm run dev             # Visual check at http://localhost:8080/option-0X
```
