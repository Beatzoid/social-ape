import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";

import screamRoutes from "./routes/scream";
import userRoutes from "./routes/user";

admin.initializeApp();

const app = express();

app.get("/", (_, res) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    return res.send("Hello world!");
});

app.use(screamRoutes);
app.use(userRoutes);

export const api = functions.https.onRequest(app);

// TRIGGERS

export const createNotificationOnLike = functions.firestore
    .document("/likes/{id}")
    .onCreate(async (snapshot) => {
        const screamDoc = await admin
            .firestore()
            .doc(`/screams/${snapshot.data().screamId}`)
            .get();
        if (!screamDoc.exists) return;

        await admin.firestore().doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: screamDoc.data()?.userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: screamDoc.id
        });

        return;
    });

export const deleteNotificationOnUnlike = functions.firestore
    .document("/likes/{id}")
    .onDelete(async (snapshot) => {
        await admin.firestore().doc(`/notifications/${snapshot.id}`).delete();
        return;
    });

export const createNotificationOnComment = functions.firestore
    .document("/comments/{id}")
    .onCreate(async (snapshot) => {
        const screamDoc = await admin
            .firestore()
            .doc(`/screams/${snapshot.data().screamId}`)
            .get();
        if (!screamDoc.exists) return;

        await admin.firestore().doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: screamDoc.data()?.userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: screamDoc.id
        });

        return;
    });
