/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

let wrapper;

function buttons(current = wrapper) {
  return current.findAllComponents({ name: "VBtn" });
}

function buttonByText(label, current = wrapper) {
  return buttons(current).find((btn) => btn.text().includes(label));
}

function dialogs() {
  return wrapper.findAllComponents({ name: "VDialog" });
}

function listItemByName(name) {
  return wrapper.findAllComponents({ name: "VListItem" }).find((item) =>
    item.text().includes(name)
  );
}

function textFields() {
  return wrapper.findAllComponents({ name: "VTextField" });
}

async function mountDashboard(lists = []) {
  listServices.getLists.mockResolvedValue({ data: lists });
  const mounted = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.createList.mockResolvedValue({
        data: { id: 3, name: "Groceries", userId: 1 },
      });

      await mountDashboard();

      await buttonByText("+ New List").trigger("click");
      await flushPromises();

      await textFields()[0].setValue("Groceries");
      await buttonByText("Create").trigger("click");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith("Groceries");
      expect(wrapper.text()).toContain("Groceries");
      expect(dialogs()[0].props("modelValue")).toBe(false);
    });

    it("User creates a list with an empty name", async () => {
      await mountDashboard();

      await buttonByText("+ New List").trigger("click");
      await flushPromises();

      const form = wrapper.findAllComponents({ name: "VForm" })[0];
      await buttonByText("Create").trigger("click");
      await flushPromises();
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(listServices.createList).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("List name is required.");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      await mountDashboard([
        { id: 1, name: "Personal", userId: 1 },
        { id: 2, name: "Work", userId: 1 },
      ]);

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");

      const workRow = listItemByName("Work");
      const personalRow = listItemByName("Personal");

      expect(workRow.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(workRow.find('[aria-label="Delete list"]').exists()).toBe(true);
      expect(personalRow.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(personalRow.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      await mountDashboard([]);

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);

      const row = listItemByName("Groceries");

      expect(row.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.updateList.mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);

      await listItemByName("Groceries")
        .find('[aria-label="Edit list"]')
        .trigger("click");
      await flushPromises();

      await textFields()[1].setValue("Shopping");
      await buttonByText("Save").trigger("click");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(1, "Shopping");
      expect(wrapper.text()).toContain("Shopping");
      expect(listItemByName("Groceries")).toBeUndefined();
    });

    it("User deletes a list", async () => {
      listServices.deleteList.mockResolvedValue({
        data: { message: "List deleted successfully." },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);

      await listItemByName("Groceries")
        .find('[aria-label="Delete list"]')
        .trigger("click");
      await flushPromises();

      await buttonByText("Delete").trigger("click");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(1);
      expect(listItemByName("Groceries")).toBeUndefined();
    });
  });
});
