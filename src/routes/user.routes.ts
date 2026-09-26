import { Router } from "express";
import { getProfile, getAllUsers, updateUser, deleteUser } from "../controllers/user.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { rbac } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate";
import { UpdateUserSchema } from "../schemas/user.schema";

const router = Router();

router.get("/me", verifyToken, getProfile);
router.get("/", verifyToken, rbac("manager", "admin"), getAllUsers);
router.patch("/:id", verifyToken, rbac("admin"), validate(UpdateUserSchema), updateUser);
router.delete("/:id", verifyToken, rbac("admin"), deleteUser);

export default router;
