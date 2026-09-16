<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addName = ref("");
const addForm = ref(null);
const addLoading = ref(false);

const editDialog = ref(false);
const editList = ref(null);
const editName = ref("");
const editForm = ref(null);
const editLoading = ref(false);

const deleteDialog = ref(false);
const deleteList = ref(null);
const deleteLoading = ref(false);

const itemsDialog = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todoErrorMessage = ref("");

const addItemDialog = ref(false);
const addTitle = ref("");
const addItemForm = ref(null);
const addItemLoading = ref(false);

const editItemDialog = ref(false);
const editTodo = ref(null);
const editTitle = ref("");
const editItemForm = ref(null);
const editItemLoading = ref(false);

const deleteItemDialog = ref(false);
const deleteTodo = ref(null);
const deleteItemLoading = ref(false);

const listNameRules = [(value) => !!value?.trim() || "List name is required."];
const todoTitleRules = [(value) => !!value?.trim() || "Todo title is required."];

function sortLists(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function sortTodos(items) {
  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
}

function apiErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Failed to load lists.");
  } finally {
    loading.value = false;
  }
}

onMounted(loadLists);

function openAddDialog() {
  addName.value = "";
  errorMessage.value = "";
  addDialog.value = true;
}

async function createList() {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.createList(addName.value.trim());
    lists.value = sortLists([...lists.value, response.data]);
    addDialog.value = false;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Failed to create list.");
  } finally {
    addLoading.value = false;
  }
}

function openEditDialog(list) {
  editList.value = list;
  editName.value = list.name;
  errorMessage.value = "";
  editDialog.value = true;
}

async function saveList() {
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  editLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.updateList(editList.value.id, editName.value.trim());
    lists.value = sortLists(
      lists.value.map((list) => (list.id === response.data.id ? response.data : list))
    );
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Failed to update list.");
  } finally {
    editLoading.value = false;
  }
}

function openDeleteDialog(list) {
  deleteList.value = list;
  errorMessage.value = "";
  deleteDialog.value = true;
}

async function confirmDelete() {
  deleteLoading.value = true;
  errorMessage.value = "";

  try {
    await listServices.deleteList(deleteList.value.id);
    lists.value = lists.value.filter((list) => list.id !== deleteList.value.id);
    deleteDialog.value = false;
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "Failed to delete list.");
  } finally {
    deleteLoading.value = false;
  }
}

async function openItemsDialog(list) {
  itemsList.value = list;
  todos.value = [];
  todoErrorMessage.value = "";
  itemsDialog.value = true;
  todosLoading.value = true;

  try {
    const response = await todoServices.getTodos(list.id);
    todos.value = response.data;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Failed to load todos.");
  } finally {
    todosLoading.value = false;
  }
}

function closeItemsDialog() {
  itemsDialog.value = false;
  addItemDialog.value = false;
  editItemDialog.value = false;
  deleteItemDialog.value = false;
}

function openAddItemDialog() {
  addTitle.value = "";
  todoErrorMessage.value = "";
  addItemDialog.value = true;
}

async function createTodo() {
  const { valid } = await addItemForm.value.validate();

  if (!valid) {
    return;
  }

  addItemLoading.value = true;
  todoErrorMessage.value = "";

  try {
    const response = await todoServices.createTodo(itemsList.value.id, addTitle.value.trim());
    todos.value = sortTodos([...todos.value, response.data]);
    addItemDialog.value = false;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Failed to create todo.");
  } finally {
    addItemLoading.value = false;
  }
}

async function toggleTodo(todo, completed) {
  todoErrorMessage.value = "";

  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Failed to update todo.");
  }
}

function openEditItemDialog(todo) {
  editTodo.value = todo;
  editTitle.value = todo.title;
  todoErrorMessage.value = "";
  editItemDialog.value = true;
}

async function saveTodo() {
  const { valid } = await editItemForm.value.validate();

  if (!valid) {
    return;
  }

  editItemLoading.value = true;
  todoErrorMessage.value = "";

  try {
    const response = await todoServices.updateTodo(editTodo.value.id, {
      title: editTitle.value.trim(),
    });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
    editItemDialog.value = false;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Failed to update todo.");
  } finally {
    editItemLoading.value = false;
  }
}

function openDeleteItemDialog(todo) {
  deleteTodo.value = todo;
  todoErrorMessage.value = "";
  deleteItemDialog.value = true;
}

async function confirmDeleteTodo() {
  deleteItemLoading.value = true;
  todoErrorMessage.value = "";

  try {
    await todoServices.deleteTodo(deleteTodo.value.id);
    todos.value = todos.value.filter((item) => item.id !== deleteTodo.value.id);
    deleteItemDialog.value = false;
  } catch (error) {
    todoErrorMessage.value = apiErrorMessage(error, "Failed to delete todo.");
  } finally {
    deleteItemLoading.value = false;
  }
}
</script>

<template>
  <v-container>
    <v-card elevation="2">
      <v-card-item>
        <v-card-title class="text-h5">My Lists</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <p v-if="!loading && lists.length === 0">
          No lists yet. Create your first list.
        </p>

        <v-list v-else-if="!loading">
          <v-list-item v-for="list in lists" :key="list.id">
            <v-list-item-title>{{ list.name }}</v-list-item-title>
            <template #append>
              <v-btn
                icon="mdi-format-list-bulleted"
                size="small"
                variant="text"
                aria-label="Items"
                @click.stop="openItemsDialog(list)"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit list"
                @click.stop="openEditDialog(list)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete list"
                @click.stop="openDeleteDialog(list)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="addDialog" max-width="480" eager>
      <v-card>
        <v-card-title>New List</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="addName"
              label="List name"
              :rules="listNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="addLoading"
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="480" eager>
      <v-card>
        <v-card-title>Rename List</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          <v-form ref="editForm" @submit.prevent="saveList">
            <v-text-field
              v-model="editName"
              label="List name"
              :rules="listNameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="editLoading"
            @click="saveList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480" eager>
      <v-card>
        <v-card-title>Delete List</v-card-title>
        <v-card-text>
          <v-alert v-if="errorMessage" type="error" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          Delete {{ deleteList?.name }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteLoading"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialog" max-width="640">
      <v-card>
        <v-card-item>
          <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openAddItemDialog"
            >
              + Add Item
            </v-btn>
          </template>
        </v-card-item>

        <v-progress-linear v-if="todosLoading" indeterminate color="primary" />

        <v-card-text>
          <v-alert v-if="todoErrorMessage" type="error" class="mb-4">
            {{ todoErrorMessage }}
          </v-alert>

          <p v-if="!todosLoading && todos.length === 0">
            No todos in this list yet.
          </p>

          <v-list v-else-if="!todosLoading">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  hide-details
                  density="compact"
                  :model-value="todo.completed"
                  @update:model-value="(value) => toggleTodo(todo, value)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click.stop="openEditItemDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click.stop="openDeleteItemDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItemsDialog">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" max-width="480">
      <v-card>
        <v-card-title>Add Item</v-card-title>
        <v-card-text>
          <v-alert v-if="todoErrorMessage" type="error" class="mb-4">
            {{ todoErrorMessage }}
          </v-alert>
          <v-form ref="addItemForm" @submit.prevent="createTodo">
            <v-text-field
              v-model="addTitle"
              label="Todo title"
              :rules="todoTitleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="addItemLoading"
            @click="createTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" max-width="480">
      <v-card>
        <v-card-title>Edit Item</v-card-title>
        <v-card-text>
          <v-alert v-if="todoErrorMessage" type="error" class="mb-4">
            {{ todoErrorMessage }}
          </v-alert>
          <v-form ref="editItemForm" @submit.prevent="saveTodo">
            <v-text-field
              v-model="editTitle"
              label="Todo title"
              :rules="todoTitleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="editItemLoading"
            @click="saveTodo"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemDialog" max-width="480">
      <v-card>
        <v-card-title>Delete Item</v-card-title>
        <v-card-text>
          <v-alert v-if="todoErrorMessage" type="error" class="mb-4">
            {{ todoErrorMessage }}
          </v-alert>
          Delete {{ deleteTodo?.title }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleteItemLoading"
            @click="confirmDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
