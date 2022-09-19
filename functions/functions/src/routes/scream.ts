import { Router } from "express";
import { createScream, getScreams } from "../handlers/screams";
import { firebaseAuth } from "../middleware/auth";

const router = Router();

router.get("/screams", getScreams);
router.post("/scream", firebaseAuth, createScream);

export default router;
