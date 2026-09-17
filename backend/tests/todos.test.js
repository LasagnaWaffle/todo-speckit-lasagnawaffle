/**
 * Feature 3 — Todo List Item Management
 * Feature 5 — Todo Due Date
 * Spec: features/feature-3-todo-list-item-management.md
 * Spec: features/feature-5-todo-due-date.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  createList,
  createTodo,
} from "./helpers.js";

function dueDateValue(value) {
  if (value == null) {
    return value;
  }

  return String(value).slice(0, 10);
}

describe("Feature 3 — Todo API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: "Buy milk",
        completed: false,
        userId: user.user.userId,
        listId: list.body.id,
      });
      expect(response.body.id).toBeDefined();
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "   ");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Todo title is required.");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const listA = await createList(userA.authHeader, "Work");
      const listB = await createList(userB.authHeader, "Work");
      await createTodo(userA.authHeader, listA.body.id, "My task");
      await createTodo(userB.authHeader, listB.body.id, "Their task");

      const response = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe("My task");
      expect(response.body.some((todo) => todo.title === "Their task")).toBe(false);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.title).toBe("Buy milk");
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");
      await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ completed: true });

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${created.body.id}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Todo deleted successfully.");

      const deleted = await db.todo.findByPk(created.body.id);
      expect(deleted).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret");
      await createTodo(userB.authHeader, secretList.body.id, "Hidden task");

      const response = await request(app)
        .get(`/todo/lists/${secretList.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);
      expect(response.body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ title: "Hidden task" })])
      );
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret");

      const response = await createTodo(userA.authHeader, secretList.body.id, "Intruder task");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);

      const todos = await db.todo.findAll({ where: { listId: secretList.body.id } });
      expect(todos).toHaveLength(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .put(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const unchanged = await db.todo.findByPk(secretTodo.body.id);
      expect(unchanged.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .delete(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const preserved = await db.todo.findByPk(secretTodo.body.id);
      expect(preserved).not.toBeNull();
      expect(preserved.title).toBe("Hidden task");
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userA.authHeader, "Groceries");

      const response = await createTodo(userA.authHeader, list.body.id, "Buy milk", {
        userId: userB.user.userId,
      });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(userB.user.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const response = await request(app).get("/todo/lists/1/todos");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const milk = await createTodo(user.authHeader, list.body.id, "Buy milk");
      const eggs = await createTodo(user.authHeader, list.body.id, "Buy eggs");

      const response = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);

      const remaining = await db.todo.findAll({
        where: { id: [milk.body.id, eggs.body.id] },
      });
      expect(remaining).toHaveLength(0);

      const queried = await request(app)
        .get(`/todo/lists/${list.body.id}/todos`)
        .set(user.authHeader);

      expect(queried.status).toBe(404);
    });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-15",
      });

      expect(response.status).toBe(201);
      expect(dueDateValue(response.body.dueDate)).toBe("2026-07-15");
      expect(response.body.title).toBe("Buy milk");
    });

    it("User adds a todo without a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Task", {
        dueDate: "not-a-date",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Due date must be a valid date in YYYY-MM-DD format.");

      const todos = await db.todo.findAll({ where: { listId: list.body.id } });
      expect(todos).toHaveLength(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(dueDateValue(response.body.dueDate)).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-20",
      });

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-15",
      });

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Due date must be a valid date in YYYY-MM-DD format.");

      const unchanged = await db.todo.findByPk(created.body.id);
      expect(dueDateValue(unchanged.dueDate)).toBe("2026-07-15");
    });

    it("User cannot set due date on another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .put(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const unchanged = await db.todo.findByPk(secretTodo.body.id);
      expect(unchanged.dueDate).toBeNull();
    });
  });
});
