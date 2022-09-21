import { Router } from "express";
import {
    createScream,
    getScreams,
    getScream,
    createComment,
    likeScream,
    unlikeScream,
    deleteScream
} from "../handlers/screams";
import { firebaseAuth } from "../middleware/auth";

const router = Router();

router.get("/screams", getScreams);
router.post("/scream", firebaseAuth, createScream);
router.get("/scream/:screamId", getScream);

router.post("/scream/:screamId/comment", firebaseAuth, createComment);
router.get("/scream/:screamId/like", firebaseAuth, likeScream);
router.get("/scream/:screamId/unlike", firebaseAuth, unlikeScream);

router.delete("/scream/:screamId", firebaseAuth, deleteScream);

export default router;
