import { Router } from "express";
import { firebaseAuth } from "../middleware/auth";

import {
    addUserDetails,
    getAuthenticatedUser,
    login,
    signup,
    uploadUserImage,
    getUserDetails,
    markNotificationsRead
} from "../handlers/users";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/user/image", firebaseAuth, uploadUserImage);
router.post("/user", firebaseAuth, addUserDetails);
router.get("/user/:handle", getUserDetails);
router.get("/user", firebaseAuth, getAuthenticatedUser);

router.get("/mark-notifications-read", firebaseAuth, markNotificationsRead);

export default router;
