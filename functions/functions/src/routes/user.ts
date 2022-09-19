import { Router } from "express";
import { firebaseAuth } from "../middleware/auth";

import {
    addUserDetails,
    getAuthenticatedUser,
    login,
    signup,
    uploadUserImage
} from "../handlers/users";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/user/image", firebaseAuth, uploadUserImage);
router.post("/user", firebaseAuth, addUserDetails);
router.get("/user", firebaseAuth, getAuthenticatedUser);

export default router;
