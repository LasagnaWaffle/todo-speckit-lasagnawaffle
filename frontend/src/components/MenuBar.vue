<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const user = ref(Utils.getStore("user"));
const profileMenu = ref(false);
const editDialog = ref(false);
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const saveLoading = ref(false);
const errorMessage = ref("");

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

function refreshUser() {
  user.value = Utils.getStore("user");
}

function prefillFrom(source) {
  fName.value = source?.fName || "";
  lName.value = source?.lName || "";
  email.value = source?.email || "";
  username.value = source?.username || "";
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

async function openEditDialog() {
  profileMenu.value = false;
  errorMessage.value = "";
  password.value = "";
  confirmPassword.value = "";
  prefillFrom(user.value);
  editDialog.value = true;

  const userId = user.value?.userId;
  if (!userId) {
    return;
  }

  try {
    const response = await userServices.getUser(userId);
    prefillFrom(response.data);
  } catch {
    // Keep session values when the profile fetch fails.
  }
}

function closeEditDialog() {
  editDialog.value = false;
  errorMessage.value = "";
}

async function saveProfile() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  const userId = user.value?.userId;
  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };

  if (password.value) {
    payload.password = password.value;
  }

  saveLoading.value = true;

  try {
    const response = await userServices.updateUser(userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      username: response.data.username,
      role: response.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    saveLoading.value = false;
  }
}

async function handleLogOut() {
  profileMenu.value = false;
  await authServices.logoutUser();
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="profileMenu" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          aria-label="Profile"
          v-bind="props"
        />
      </template>
      <v-card min-width="280">
        <v-list>
          <v-list-item :title="displayName">
            <template #subtitle>
              <div>{{ user?.username }}</div>
              <div>{{ user?.email }}</div>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-list>
          <v-list-item title="Log out" @click="handleLogOut" />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="520" eager>
    <v-card>
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-form ref="form" @submit.prevent="saveProfile">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="fName"
                label="First name"
                density="comfortable"
                rounded="lg"
                autocomplete="given-name"
                :rules="fNameRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="lName"
                label="Last name"
                density="comfortable"
                rounded="lg"
                autocomplete="family-name"
                :rules="lNameRules"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                density="comfortable"
                rounded="lg"
                autocomplete="email"
                :rules="emailRules"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="username"
                label="Username"
                density="comfortable"
                rounded="lg"
                autocomplete="username"
                :rules="usernameRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                density="comfortable"
                rounded="lg"
                autocomplete="new-password"
                :rules="passwordRules"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                density="comfortable"
                rounded="lg"
                autocomplete="new-password"
                :rules="confirmPasswordRules"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saveLoading"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
