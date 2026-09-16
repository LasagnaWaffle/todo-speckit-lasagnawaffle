/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

let wrapper;

const sessionUser = {
  userId: 1,
  token: "test-token",
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  role: "worker",
};

const profileUser = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  role: "worker",
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

function visibleText() {
  return `${wrapper.text()}\n${document.body.textContent || ""}`;
}

function buttons() {
  return wrapper.findAllComponents({ name: "VBtn" });
}

function buttonByText(label) {
  return buttons().find((btn) => btn.text().includes(label));
}

function textFields() {
  return wrapper.findAllComponents({ name: "VTextField" });
}

function editDialog() {
  return wrapper.findAllComponents({ name: "VDialog" })[0];
}

function profileButton() {
  return wrapper.find('[aria-label="Profile"]');
}

async function openProfileMenu() {
  await profileButton().trigger("click");
  await flushPromises();
}

async function openEditDialog() {
  await openProfileMenu();
  await buttonByText("Edit Profile").trigger("click");
  await flushPromises();
}

async function fillProfileForm(overrides = {}) {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    password: "",
    confirmPassword: "",
    ...overrides,
  };

  const fields = textFields();
  await fields[0].setValue(values.fName);
  await fields[1].setValue(values.lName);
  await fields[2].setValue(values.email);
  await fields[3].setValue(values.username);
  await fields[4].setValue(values.password);
  await fields[5].setValue(values.confirmPassword);
}

async function mountMenuBar() {
  const mounted = await mountWithPlugins(
    {
      components: { MenuBar },
      template: "<v-app><MenuBar /></v-app>",
    },
    {
      attachTo: document.body,
    }
  );
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", { ...sessionUser });
    userServices.getUser.mockResolvedValue({ data: { ...profileUser } });
    userServices.updateUser.mockResolvedValue({ data: { ...profileUser } });
    authServices.logoutUser.mockResolvedValue();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenuBar();

      await openProfileMenu();

      expect(visibleText()).toContain("Jane Doe");
      expect(visibleText()).toContain("jdoe");
      expect(visibleText()).toContain("jane@example.com");
      expect(visibleText()).toContain("Edit Profile");
      expect(visibleText()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      await mountMenuBar();

      await openEditDialog();

      expect(editDialog().props("modelValue")).toBe(true);
      expect(visibleText()).toContain("Edit Profile");
      expect(textFields()[0].props("modelValue")).toBe("Jane");
      expect(textFields()[1].props("modelValue")).toBe("Doe");
      expect(textFields()[2].props("modelValue")).toBe("jane@example.com");
      expect(textFields()[3].props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      await mountMenuBar();

      await openEditDialog();
      await fillProfileForm({ fName: "Janet" });
      await buttonByText("Cancel").trigger("click");
      await flushPromises();

      expect(editDialog().props("modelValue")).toBe(false);
      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });
    });

    it("User saves profile changes", async () => {
      const updated = {
        ...profileUser,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      };
      userServices.updateUser.mockResolvedValue({ data: updated });

      await mountMenuBar();

      await openEditDialog();
      await fillProfileForm({
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(editDialog().props("modelValue")).toBe(false);
      expect(Utils.getStore("user")).toMatchObject({
        userId: 1,
        token: "test-token",
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });

      await openProfileMenu();

      expect(visibleText()).toContain("Janet Smith");
      expect(visibleText()).toContain("jsmith");
      expect(visibleText()).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      await mountMenuBar();

      await openEditDialog();
      await fillProfileForm({ email: "notanemail" });
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(visibleText()).toContain("Enter a valid email address.");
    });

    it("User saves profile with mismatched passwords", async () => {
      await mountMenuBar();

      await openEditDialog();
      await fillProfileForm({
        password: "password123",
        confirmPassword: "differentpassword",
      });
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(visibleText()).toContain("Passwords do not match.");
    });

    it("User saves profile with a password that is too short", async () => {
      await mountMenuBar();

      await openEditDialog();
      await fillProfileForm({
        password: "short",
        confirmPassword: "short",
      });
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(visibleText()).toContain("Password must be at least 8 characters.");
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      await mountMenuBar();

      await openEditDialog();
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(visibleText()).toContain("Username is already taken.");
      expect(editDialog().props("modelValue")).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      await mountMenuBar();

      authServices.logoutUser.mockImplementation(async () => {
        Utils.removeItem("user");
        window.dispatchEvent(new CustomEvent("user-logged-out"));
      });

      await openProfileMenu();
      const logOutItem = wrapper
        .findAllComponents({ name: "VListItem" })
        .find((item) => item.text().includes("Log out"));
      await logOutItem.trigger("click");
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      await mountMenuBar();

      expect(visibleText()).not.toContain("Sign out");
      expect(buttonByText("Sign out")).toBeUndefined();
    });
  });
});
