import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";

import * as express from "express";

import { auth } from "./constants";

import { validateSignup, validateLogin } from "./validators";

import { firebaseAuth } from "./middleware/auth";

admin.initializeApp();

const app = express();

app.get("/", (_, res) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    return res.send("Hello world!");
});

// SCREAMS

app.get("/screams", async (_, res) => {
    const data = await admin
        .firestore()
        .collection("screams")
        .orderBy("createdAt", "desc")
        .get();
    const screams: admin.firestore.DocumentData[] = [];

    data.forEach((doc) => {
        screams.push({ screamId: doc.id, ...doc.data() });
    });

    return res.json({ screams });
});

app.post("/scream", firebaseAuth, async (req, res) => {
    const newScream = {
        userHandle: req.user.handle,
        body: req.body.body,
        createdAt: new Date().toISOString()
    };

    const newScreamData = await admin
        .firestore()
        .collection("screams")
        .add(newScream);
    const msg = `Successfully created scream with id ${newScreamData.id}`;

    functions.logger.log(msg);
    return res.json({ msg });
});

// USERS

app.post("/signup", async (req, res) => {
    try {
        const newUser = {
            handle: req.body.handle,
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword
        };

        const errors = validateSignup(newUser);

        if (Object.keys(errors).length > 0) return res.status(400).json(errors);

        // TODO: Validate data
        const existingUserDoc = await admin
            .firestore()
            .doc(`/users/${newUser.handle}`)
            .get();

        if (existingUserDoc.exists) {
            res.status(400).json({ handle: "User handle already in use" });
            return;
        }

        const newUserData = await createUserWithEmailAndPassword(
            auth,
            newUser.email,
            newUser.password
        );
        const userIdToken = await newUserData.user.getIdToken();

        const userCredentials = {
            userId: newUserData.user.uid,
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString()
        };

        await admin
            .firestore()
            .doc(`/users/${newUser.handle}`)
            .set(userCredentials);

        functions.logger.log(
            `User ${newUserData.user.uid} successfully signed up with token ${userIdToken}`
        );
        return res.status(201).json({ userIdToken });
    } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
            return res.status(400).json({ email: "Email already in use" });
        } else {
            return res.status(500).json({ err: err.code });
        }
    }
});

app.post("/login", async (req, res) => {
    try {
        const userCredentials = {
            email: req.body.email,
            password: req.body.password
        };

        const errors = validateLogin(userCredentials);

        if (Object.keys(errors).length > 0) return res.status(400).json(errors);

        const data = await signInWithEmailAndPassword(
            auth,
            userCredentials.email,
            userCredentials.password
        );
        const token = await data.user.getIdToken();
        return res.json({ token });
    } catch (err: any) {
        if (err.code === "auth/wrong-password") {
            return res.status(403).json({ password: "Incorrect password" });
        } else {
            return res.status(500).json({ err: err.code });
        }
    }
});

export const api = functions.https.onRequest(app);
