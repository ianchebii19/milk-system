import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../config/prismaConfig.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Register Admin
export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "ADMIN" },
    });
    res.status(201).json({ message: "Admin registered", admin });
  } catch (error) {
    res.status(500).json({ error: "Email already exists" });
  }
};

// Register Operator (Only Admin can do this)
export const registerOperator = async (req, res) => {
  const { name, email, password } = req.body;

  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Unauthorized" });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const operator = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "OPERATOR" },
    });
    res.status(201).json({ message: "Operator registered", operator });
  } catch (error) {
    res.status(500).json({ error: "Email already exists" });
  }
};

// Register User (Only Operator can do this)
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (req.user.role !== "OPERATOR") return res.status(403).json({ error: "Unauthorized" });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "FARMER" },
    });
    res.status(201).json({ message: "User registered", user });
  } catch (error) {
    res.status(500).json({ error: "Email already exists" });
  }
};


// Login (for all roles)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Users (Admin Only)
export const getUsers = async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Unauthorized" });

  const users = await prisma.user.findMany();
  res.json(users);
};

export const logout = async (req, res) => {
  res.json({ message: "Logout successful" });
};