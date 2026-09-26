import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);
router.post("/refresh", validate(RefreshTokenSchema), refresh);
router.post("/logout", logout);

export default router;
