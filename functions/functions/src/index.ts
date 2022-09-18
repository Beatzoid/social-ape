import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as express from "express";

admin.initializeApp();

const app = express();

app.get("/", (_, res) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    res.send("Hello world!");
});

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

export const api = functions.https.onRequest(app);
