import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { createUserWithEmailAndPassword } from "firebase/auth";

import * as express from "express";

import { auth } from "./constants";

admin.initializeApp();

const app = express();

app.get("/", (_, res) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    res.send("Hello world!");
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

    res.json({ screams });
});

app.post("/scream", async (req, res) => {
    const newScream = {
        userHandle: req.body.userHandle,
        body: req.body.body,
        createdAt: new Date().toISOString()
    };

    const newScreamData = await admin
        .firestore()
        .collection("screams")
        .add(newScream);
    const msg = `Successfully created scream with id ${newScreamData.id}`;

    functions.logger.log(msg);
    res.json({ msg });
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
        res.status(201).json({ userIdToken });
    } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
            res.status(400).json({ email: "Email already in use" });
        } else {
            res.status(500).json({ err: err.code });
        }
    }
});

export const api = functions.https.onRequest(app);
