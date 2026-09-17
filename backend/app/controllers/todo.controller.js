import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const exports = {};

const TODO_ORDER = [
  ["completed", "ASC"],
  ["createdAt", "ASC"],
];

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DUE_DATE_MESSAGE = "Due date must be a valid date in YYYY-MM-DD format.";

function parseId(value) {
  return parseInt(value, 10);
}

function isValidCalendarDate(value) {
  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function parseDueDateInput(value) {
  if (value === undefined) {
    return { omitted: true };
  }

  if (value === null || value === "") {
    return { dueDate: null };
  }

  if (typeof value !== "string" || !isValidCalendarDate(value)) {
    return { error: INVALID_DUE_DATE_MESSAGE };
  }

  return { dueDate: value };
}

exports.findAll = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId: list.id, userId: req.user.id },
      order: TODO_ORDER,
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`Todo findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);
    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).send({ message: "Todo title is required." });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 255) {
      return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
    }

    const parsedDueDate = parseDueDateInput(req.body.dueDate);
    if (parsedDueDate.error) {
      return res.status(400).send({ message: parsedDueDate.error });
    }

    const todo = await db.todo.create({
      title: trimmedTitle,
      completed: false,
      dueDate: parsedDueDate.omitted ? null : parsedDueDate.dueDate,
      listId: list.id,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (!req.body.title?.trim()) {
        return res.status(400).send({ message: "Todo title is required." });
      }

      const trimmedTitle = req.body.title.trim();
      if (trimmedTitle.length > 255) {
        return res.status(400).send({ message: "Todo title must be 255 characters or fewer." });
      }

      todo.title = trimmedTitle;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      const parsedDueDate = parseDueDateInput(req.body.dueDate);
      if (parsedDueDate.error) {
        return res.status(400).send({ message: parsedDueDate.error });
      }

      todo.dueDate = parsedDueDate.dueDate;
    }

    await todo.save();

    return res.send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update todo." });
  }
};

exports.remove = async (req, res) => {
  try {
    const todoId = parseId(req.params.id);
    if (Number.isNaN(todoId)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();

    return res.status(200).send({ message: "Todo deleted successfully." });
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete todo." });
  }
};

export default exports;
