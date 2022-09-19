import { Router } from "express";
import { login, signup, uploadUserImage } from "../handlers/users";
import { firebaseAuth } from "../middleware/auth";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/user/image", firebaseAuth, uploadUserImage);

export default router;
