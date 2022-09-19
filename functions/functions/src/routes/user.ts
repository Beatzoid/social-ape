import { Router } from "express";
import { login, signup } from "../handlers/users";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

export default router;
