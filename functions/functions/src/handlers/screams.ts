import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Request, Response } from "express";
import { isEmpty } from "../utils/validators";

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

export const getScream = async (req: Request, res: Response) => {
    const { screamId } = req.params;
    let screamData: any = {};

    const scream = await admin.firestore().doc(`/screams/${screamId}`).get();
    if (!scream.exists) {
        return res.status(404).json({ err: "Scream not found" });
    }

    screamData = scream.data();
    screamData.screamId = scream.id;

    const commentData = await admin
        .firestore()
        .collection("comments")
        .where("screamId", "==", screamId)
        .orderBy("createdAt", "desc")
        .get();

    screamData.comments = [];

    commentData.forEach((doc) => {
        screamData.comments.push(doc.data());
    });

    return res.json(screamData);
};

export const createComment = async (req: Request, res: Response) => {
    if (isEmpty(req.body.body)) {
        return res.status(400).json({ msg: "Comment must not be empty" });
    }

    const newComment = {
        body: req.body.body,
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageURL,
        createdAt: new Date().toISOString()
    };

    const scream = await admin
        .firestore()
        .doc(`/screams/${req.params.screamId}`)
        .get();

    if (!scream.exists) {
        return res.status(404).json({ err: "Scream not found" });
    }

    await admin.firestore().collection("comments").add(newComment);

    return res.json({ msg: "Successfully commented" });
};
