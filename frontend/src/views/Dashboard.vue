<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";

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

const listNameRules = [(value) => !!value?.trim() || "List name is required."];

function sortLists(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
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
  </v-container>
</template>
