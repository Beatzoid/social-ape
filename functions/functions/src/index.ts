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
        try {
            const screamDoc = await admin
                .firestore()
                .doc(`/screams/${snapshot.data().screamId}`)
                .get();
            if (
                !screamDoc.exists &&
                snapshot.data().userHandle === snapshot.data().userHandle
            ) {
                return;
            }

            await admin.firestore().doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: screamDoc.data()?.userHandle,
                sender: snapshot.data().userHandle,
                type: "like",
                read: false,
                screamId: screamDoc.id
            });

            return;
        } catch (err: any) {
            functions.logger.error(err);
        }
    });

export const deleteNotificationOnUnlike = functions.firestore
    .document("/likes/{id}")
    .onDelete(async (snapshot) => {
        try {
            await admin
                .firestore()
                .doc(`/notifications/${snapshot.id}`)
                .delete();
            return;
        } catch (err: any) {
            functions.logger.error(err);
        }
    });

export const createNotificationOnComment = functions.firestore
    .document("/comments/{id}")
    .onCreate(async (snapshot) => {
        try {
            const screamDoc = await admin
                .firestore()
                .doc(`/screams/${snapshot.data().screamId}`)
                .get();
            if (
                !screamDoc.exists &&
                snapshot.data().userHandle === snapshot.data().userHandle
            ) {
                return;
            }

            await admin.firestore().doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: screamDoc.data()?.userHandle,
                sender: snapshot.data().userHandle,
                type: "comment",
                read: false,
                screamId: screamDoc.id
            });

            return;
        } catch (err: any) {
            functions.logger.error(err);
        }
    });

export const onUserImageChange = functions.firestore
    .document("/users/{userId}")
    .onUpdate(async (change) => {
        try {
            if (
                change.before.data().imageUrl === change.after.data().imageUrl
            ) {
                return;
            }

            const batch = admin.firestore().batch();
            const screams = await admin
                .firestore()
                .collection("screams")
                .where("userHandle", "==", change.before.data().handle)
                .get();

            screams.forEach((doc) => {
                const scream = admin.firestore().doc(`/screams/${doc.id}`);
                batch.update(scream, {
                    userImage: change.after.data().imageUrl
                });
            });

            await batch.commit();
        } catch (err: any) {
            functions.logger.error(err);
        }
    });

export const onScreamDeleted = functions.firestore
    .document("/screams/{screamId}")
    .onDelete(async (snapshot, context) => {
        try {
            const screamId = context.params.screamId;
            const batch = admin.firestore().batch();

            const comments = await admin
                .firestore()
                .collection("comments")
                .where("screamId", "==", screamId)
                .get();

            comments.forEach((doc) => {
                const commentDoc = admin.firestore().doc(`/comments/${doc.id}`);
                batch.delete(commentDoc);
            });

            const likes = await admin
                .firestore()
                .collection("likes")
                .where("screamId", "==", screamId)
                .get();

            likes.forEach((doc) => {
                const likeDoc = admin.firestore().doc(`/likes/${doc.id}`);
                batch.delete(likeDoc);
            });

            const notifications = await admin
                .firestore()
                .collection("notifications")
                .where("screamId", "==", screamId)
                .get();

            notifications.forEach((doc) => {
                const notificationDoc = admin
                    .firestore()
                    .doc(`/notifications/${doc.id}`);
                batch.delete(notificationDoc);
            });

            await batch.commit();
        } catch (err: any) {
            functions.logger.error(err);
        }
    });
