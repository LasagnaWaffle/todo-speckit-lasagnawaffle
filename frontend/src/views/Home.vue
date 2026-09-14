<script setup>
import { computed } from "vue";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const firstName = computed(() => Utils.getStore("user")?.fName || "");

const handleSignOut = async () => {
  await authServices.logoutUser();
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="2" rounded="lg">
          <v-card-item>
            <v-card-title class="text-h5">Welcome, {{ firstName }}</v-card-title>
          </v-card-item>

          <v-card-actions class="px-4 pb-4">
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="handleSignOut"
            >
              Sign out
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
