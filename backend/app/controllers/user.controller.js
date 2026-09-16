import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;

const toProfile = (user) => {
  const profile = user.toJSON();
  delete profile.password;
  return profile;
};

const exports = {};

exports.findOne = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(toProfile(user));
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const { fName, lName, email, username, password } = req.body;

    if (password && password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    if (!fName?.trim()) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName?.trim()) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!username?.trim()) {
      return res.status(400).send({ message: "Username is required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    const existingUsername = await db.user.findOne({
      where: { username: normalizedUsername, id: { [Op.ne]: user.id } },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: { email: trimmedEmail, id: { [Op.ne]: user.id } },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = fName.trim();
    user.lName = lName.trim();
    user.email = trimmedEmail;
    user.username = normalizedUsername;

    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();

    const updated = await db.user.findByPk(user.id);
    return res.send(toProfile(updated));
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update profile." });
  }
};

export default exports;
