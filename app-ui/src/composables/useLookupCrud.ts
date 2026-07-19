import { ref, onMounted } from 'vue';

// Form values flowing out of LookupFormModal: text/number inputs serialize as strings,
// checkbox fields (WP-39: offeredOnSite) as booleans.
export type LookupFormData = Record<string, string | number | boolean>;

export function useLookupCrud<T>(
  fetchAll: () => Promise<T[]>,
  create: (data: LookupFormData) => Promise<T>,
  update: (id: number, data: LookupFormData) => Promise<void>,
) {
  const items = ref<T[]>([]) as { value: T[] };
  const loading = ref(false);
  const error = ref('');
  const modalVisible = ref(false);
  const editingItem = ref<T | null>(null) as { value: T | null };

  const loadItems = async () => {
    loading.value = true;
    error.value = '';
    try {
      items.value = await fetchAll();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load data.';
    } finally {
      loading.value = false;
    }
  };

  const openAdd = () => {
    editingItem.value = null;
    modalVisible.value = true;
  };

  const openEdit = (item: T) => {
    editingItem.value = item;
    modalVisible.value = true;
  };

  const handleSave = async (formData: LookupFormData, id?: number) => {
    if (id !== undefined) {
      await update(id, formData);
    } else {
      await create(formData);
    }
    await loadItems();
    modalVisible.value = false;
  };

  onMounted(loadItems);

  return {
    items,
    loading,
    error,
    modalVisible,
    editingItem,
    loadItems,
    openAdd,
    openEdit,
    handleSave,
  };
}
