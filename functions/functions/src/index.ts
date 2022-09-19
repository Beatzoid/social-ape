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
