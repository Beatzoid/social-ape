import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const helloWorld = functions.https.onRequest((_, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello world!");
});

export const getScreams = functions.https.onRequest(async (_, res) => {
    const data = await admin.firestore().collection("screams").get();
    const screams: admin.firestore.DocumentData[] = [];

    data.forEach((doc) => {
        screams.push(doc.data());
    });

    res.json({ screams });
});

export const createScream = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(400).json({ err: "Method not allowed" });
        return;
    }

    const newScream = {
        userHandle: req.body.userHandle,
        body: req.body.body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    const newScreamData = await admin
        .firestore()
        .collection("screams")
        .add(newScream);
    const msg = `Successfully created scream with id ${newScreamData.id}`;

    functions.logger.log(msg);
    res.json({ msg });
});
