import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Request, Response } from "express";

export const getScreams = async (_: Request, res: Response) => {
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
};

export const createScream = async (req: Request, res: Response) => {
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
};
