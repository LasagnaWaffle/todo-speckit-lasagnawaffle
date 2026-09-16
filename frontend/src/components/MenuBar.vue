<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const user = ref(Utils.getStore("user"));

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

async function handleSignOut() {
  await authServices.logoutUser();
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <span class="me-4">{{ displayName }}</span>
    <v-btn variant="text" @click="handleSignOut">Sign out</v-btn>
  </v-app-bar>
</template>
