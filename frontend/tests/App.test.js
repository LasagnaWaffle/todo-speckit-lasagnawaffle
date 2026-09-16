import { describe, it, expect, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import App from "../src/App.vue";
import Utils from "../src/config/utils.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

describe("App.vue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mounts the Vuetify application shell", async () => {
    const { wrapper } = await mountWithPlugins(App, {
      router: await createTestRouter("/"),
      global: {
        stubs: {
          "router-view": true,
        },
      },
    });

    expect(wrapper.find(".v-application").exists()).toBe(true);
  });

  it("hides MenuBar on login and register routes", async () => {
    const { wrapper, router } = await mountWithPlugins(App, {
      router: await createTestRouter("/login"),
      global: {
        stubs: {
          "router-view": true,
        },
      },
    });

    expect(wrapper.findComponent({ name: "MenuBar" }).exists()).toBe(false);

    await router.push("/register");
    await flushPromises();

    expect(wrapper.findComponent({ name: "MenuBar" }).exists()).toBe(false);
  });

  it("shows MenuBar on the dashboard route", async () => {
    Utils.setStore("user", {
      userId: 1,
      token: "test-token",
      fName: "Jane",
      lName: "Doe",
      username: "jdoe",
    });

    const { wrapper } = await mountWithPlugins(App, {
      router: await createTestRouter("/"),
      global: {
        stubs: {
          "router-view": true,
        },
      },
    });

    expect(wrapper.findComponent({ name: "MenuBar" }).exists()).toBe(true);
    expect(wrapper.find('[aria-label="Profile"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Sign out");
  });
});
