/**
 * Feature 2 — Todo List Management
 * Feature 3 — Todo List Item Management
 * Feature 5 — Todo Due Date
 * Spec: features/feature-2-todo-list-management.md
 * Spec: features/feature-3-todo-list-item-management.md
 * Spec: features/feature-5-todo-due-date.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { formatDueDate } from "../src/config/validation.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
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

function buttonByExactText(label, current = wrapper) {
  return buttons(current).find((btn) => btn.text().trim() === label);
}

function lastButtonByText(label, current = wrapper) {
  const matches = buttons(current).filter((btn) => btn.text().includes(label));
  return matches[matches.length - 1];
}

function textFieldByLabel(label) {
  return wrapper.findAllComponents({ name: "VTextField" }).find(
    (field) => field.props("label") === label
  );
}

async function openItems(listName, todos = []) {
  todoServices.getTodos.mockResolvedValue({ data: todos });
  await listItemByName(listName).find('[aria-label="Items"]').trigger("click");
  await flushPromises();
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
    todoServices.getTodos.mockResolvedValue({ data: [] });
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

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      todoServices.createTodo.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          userId: 1,
        },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries");

      await buttonByText("+ Add Item").trigger("click");
      await flushPromises();

      await textFieldByLabel("Todo title").setValue("Buy milk");
      await buttonByExactText("Add").trigger("click");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, "Buy milk");
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries");

      await buttonByText("+ Add Item").trigger("click");
      await flushPromises();

      const form = wrapper.findAllComponents({ name: "VForm" }).find((item) =>
        item.findComponent({ name: "VTextField" }).props("label") === "Todo title"
      );
      await buttonByExactText("Add").trigger("click");
      await flushPromises();
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(todoServices.createTodo).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Todo title is required.");
    });

    it("Add item is only available inside the items dialog", async () => {
      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);

      expect(buttonByText("+ Add Item")).toBeUndefined();
      expect(wrapper.text()).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      await mountDashboard([{ id: 1, name: "Personal", userId: 1 }]);
      await openItems("Personal", []);

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      await mountDashboard([
        { id: 1, name: "Personal", userId: 1 },
        { id: 2, name: "Work", userId: 1 },
      ]);

      await openItems("Personal", [
        { id: 3, title: "Call mom", completed: false, listId: 1, userId: 1 },
      ]);
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      await buttonByExactText("Close").trigger("click");
      await flushPromises();

      await openItems("Work", [
        { id: 1, title: "Email client", completed: false, listId: 2, userId: 1 },
        { id: 2, title: "Write report", completed: false, listId: 2, userId: 1 },
      ]);

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
      ]);

      const checkbox = listItemByName("Buy milk").findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(listItemByName("Buy milk").html()).toContain("text-decoration-line-through");
    });

    it("User marks a completed todo as incomplete", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 },
      ]);

      expect(listItemByName("Buy milk").html()).toContain("text-decoration-line-through");

      const checkbox = listItemByName("Buy milk").findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
      expect(listItemByName("Buy milk").html()).not.toContain("text-decoration-line-through");
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { id: 10, title: "Buy oat milk", completed: false, listId: 1, userId: 1 },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
      ]);

      await listItemByName("Buy milk")
        .find('[aria-label="Edit todo"]')
        .trigger("click");
      await flushPromises();

      await textFieldByLabel("Todo title").setValue("Buy oat milk");
      await lastButtonByText("Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      todoServices.deleteTodo.mockResolvedValue({
        data: { message: "Todo deleted successfully." },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
      ]);

      await listItemByName("Buy milk")
        .find('[aria-label="Delete todo"]')
        .trigger("click");
      await flushPromises();

      await lastButtonByText("Delete").trigger("click");
      await flushPromises();

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(listItemByName("Buy milk")).toBeUndefined();
    });
  });
});

function yesterdayYmd() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      todoServices.createTodo.mockResolvedValue({
        data: {
          id: 10,
          listId: 1,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-15",
          userId: 1,
        },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries");

      await buttonByText("+ Add Item").trigger("click");
      await flushPromises();

      await textFieldByLabel("Todo title").setValue("Buy milk");
      await textFieldByLabel("Due date").setValue("2026-07-15");
      await buttonByExactText("Add").trigger("click");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, "Buy milk", "2026-07-15");
      expect(document.body.textContent).toContain("Buy milk");
      expect(document.body.textContent).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: {
          id: 10,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-20",
          listId: 1,
          userId: 1,
        },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: false, dueDate: null, listId: 1, userId: 1 },
      ]);

      await listItemByName("Buy milk")
        .find('[aria-label="Edit todo"]')
        .trigger("click");
      await flushPromises();

      await textFieldByLabel("Due date").setValue("2026-07-20");
      await lastButtonByText("Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: {
          id: 10,
          title: "Buy milk",
          completed: false,
          dueDate: null,
          listId: 1,
          userId: 1,
        },
      });

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        {
          id: 10,
          title: "Buy milk",
          completed: false,
          dueDate: "2026-07-20",
          listId: 1,
          userId: 1,
        },
      ]);

      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));

      await listItemByName("Buy milk")
        .find('[aria-label="Edit todo"]')
        .trigger("click");
      await flushPromises();

      await textFieldByLabel("Due date").setValue("");
      await lastButtonByText("Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(document.body.textContent).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const dueDate = yesterdayYmd();

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: false, dueDate, listId: 1, userId: 1 },
      ]);

      const row = listItemByName("Buy milk");
      expect(row.text()).toContain(formatDueDate(dueDate));
      expect(row.html()).toContain("text-error");
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const dueDate = yesterdayYmd();

      await mountDashboard([{ id: 1, name: "Groceries", userId: 1 }]);
      await openItems("Groceries", [
        { id: 10, title: "Buy milk", completed: true, dueDate, listId: 1, userId: 1 },
      ]);

      const row = listItemByName("Buy milk");
      expect(row.text()).toContain(formatDueDate(dueDate));
      expect(row.html()).not.toContain("text-error");
    });
  });
});
