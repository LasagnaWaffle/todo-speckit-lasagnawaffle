/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const ownProfileBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "a@example.com",
  username: "usera",
  ...overrides,
});

describe("Feature 4 — User profile API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const user = await registerUser({
        email: "a@example.com",
        username: "usera",
      });

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send(
          ownProfileBody({
            fName: "Janet",
            lName: "Smith",
            email: "janet@example.com",
            username: "jsmith",
          })
        );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.user.userId,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("User fetches their own profile", async () => {
      const user = await registerUser({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });

      const response = await request(app)
        .get(`/todo/users/${user.user.userId}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.user.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        `User with id=${userB.user.userId} not found.`
      );
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        fName: "Bob",
        lName: "Builder",
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader)
        .send(
          ownProfileBody({
            fName: "Hijacked",
            email: "hijacked@example.com",
            username: "hijacked",
          })
        );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        `User with id=${userB.user.userId} not found.`
      );

      const unchanged = await db.user.findByPk(userB.user.userId);
      expect(unchanged.fName).toBe("Bob");
      expect(unchanged.email).toBe("b@example.com");
      expect(unchanged.username).toBe("userb");
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send({ password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters.");
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await registerUser({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .set(user.authHeader)
        .send({
          lName: "Doe",
          email: "jane@example.com",
          username: "jdoe",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("First name is required.");

      const unchanged = await db.user.findByPk(user.user.userId);
      expect(unchanged.fName).toBe("Jane");
      expect(unchanged.lName).toBe("Doe");
      expect(unchanged.email).toBe("jane@example.com");
      expect(unchanged.username).toBe("jdoe");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(ownProfileBody({ username: "userb" }));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is already taken.");

      const userB = await db.user.findOne({ where: { username: "userb" } });
      expect(userB).not.toBeNull();
      expect(userB.email).toBe("b@example.com");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(ownProfileBody({ email: "b@example.com" }));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered.");

      const userB = await db.user.findOne({ where: { email: "b@example.com" } });
      expect(userB).not.toBeNull();
      expect(userB.username).toBe("userb");
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app)
        .put("/todo/users/1")
        .send(ownProfileBody());

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
