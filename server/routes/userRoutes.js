import express from "express";
import {
  registerAdmin,
  registerOperator,
  registerUser,
  login,
  getUsers,
  logout
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register-admin", registerAdmin);
router.post("/register-operator", protect(["ADMIN"]), registerOperator);
router.post("/register-user", protect(["OPERATOR"]), registerUser);
router.post("/login", login);
router.get("/users", protect(["ADMIN"]), getUsers);
router.post("/logout", logout);
router.get("/check-auth", protect(), (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user,
  });
});

export default router;
