import { Router } from "express";
import {
    createScream,
    getScreams,
    getScream,
    createComment
} from "../handlers/screams";
import { firebaseAuth } from "../middleware/auth";

const router = Router();

router.get("/screams", getScreams);
router.post("/scream", firebaseAuth, createScream);
router.get("/scream/:screamId", getScream);
router.post("/scream/:screamId/comment", firebaseAuth, createComment);

export default router;
