import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Request, Response } from "express";
import { isEmpty } from "../utils/validators";

export const getScreams = async (_: Request, res: Response) => {
    try {
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
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const createScream = async (req: Request, res: Response) => {
    try {
        const newScream = {
            userHandle: req.user.handle,
            body: req.body.body,
            userImage: req.user.imageURL,
            likeCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString()
        };

        const newScreamData = await admin
            .firestore()
            .collection("screams")
            .add(newScream);

        const resScream: any = { ...newScream };
        resScream.screamId = newScreamData.id;

        functions.logger.log(
            `Successfully created scream with id ${newScreamData.id}`
        );
        return res.json(resScream);
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const getScream = async (req: Request, res: Response) => {
    try {
        const { screamId } = req.params;
        let screamData: any = {};

        const scream = await admin
            .firestore()
            .doc(`/screams/${screamId}`)
            .get();
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
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        if (isEmpty(req.body.body)) {
            return res
                .status(400)
                .json({ comment: "Comment must not be empty" });
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

        await scream.ref.update({
            commentCount: scream.data()?.commentCount + 1
        });
        await admin.firestore().collection("comments").add(newComment);

        return res.json({ msg: "Successfully commented" });
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const likeScream = async (req: Request, res: Response) => {
    try {
        const likeDoc = await admin
            .firestore()
            .collection("likes")
            .where("userHandle", "==", req.user.handle)
            .where("screamId", "==", req.params.screamId)
            .limit(1)
            .get();

        const screamDoc = await admin
            .firestore()
            .doc(`/screams/${req.params.screamId}`)
            .get();
        const screamData: any = screamDoc.data();

        if (!screamDoc.exists) {
            return res.status(404).json({ err: "Scream not found" });
        }

        if (likeDoc.empty) {
            await admin.firestore().collection("likes").add({
                screamId: req.params.screamId,
                userHandle: req.user.handle
            });
            screamData.likeCount++;
            await admin
                .firestore()
                .doc(`/screams/${req.params.screamId}`)
                .update({ likeCount: screamData.likeCount });

            return res.json(screamData);
        } else {
            return res.status(400).json({ err: "Scream already liked" });
        }
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const unlikeScream = async (req: Request, res: Response) => {
    try {
        const likeDoc = await admin
            .firestore()
            .collection("likes")
            .where("userHandle", "==", req.user.handle)
            .where("screamId", "==", req.params.screamId)
            .limit(1)
            .get();

        const screamDoc = await admin
            .firestore()
            .doc(`/screams/${req.params.screamId}`)
            .get();
        const screamData: any = screamDoc.data();

        if (!screamDoc.exists) {
            return res.status(404).json({ err: "Scream not found" });
        }

        if (likeDoc.empty) {
            return res.status(400).json({ err: "Scream not liked" });
        }

        await admin.firestore().doc(`/likes/${likeDoc.docs[0].id}`).delete();

        screamData.likeCount--;
        await admin
            .firestore()
            .doc(`/screams/${req.params.screamId}`)
            .update({ likeCount: screamData.likeCount });

        return res.json(screamData);
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const deleteScream = async (req: Request, res: Response) => {
    try {
        const screamDoc = await admin
            .firestore()
            .doc(`/screams/${req.params.screamId}`)
            .get();

        if (!screamDoc.exists) {
            return res.json(404).json({ err: "Scream not found" });
        }

        if (screamDoc.data()?.userHandle !== req.user.handle) {
            return res.status(403).json({ err: "Unauthorized" });
        }

        await screamDoc.ref.delete();
        return res.json({ msg: "Successfully deleted" });
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};
