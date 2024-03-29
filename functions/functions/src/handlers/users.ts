import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as BusBoy from "busboy";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../constants";

import { Request, Response } from "express";

import {
    validateLogin,
    validateSignup,
    reduceUserDetails
} from "../utils/validators";

export const signup = async (req: Request, res: Response) => {
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
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/noImg.png?alt=media`
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
            functions.logger.error(err);
            return res.status(500).json({
                general: "Something went wrong, please try again later."
            });
        }
    }
};

export const login = async (req: Request, res: Response) => {
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
            return res.status(403).json({ general: "Incorrect credentials" });
        } else {
            functions.logger.error(err);
            return res.status(500).json({
                general: "Something went wrong, please try again later"
            });
        }
    }
};

export const uploadUserImage = async (req: Request, res: Response) => {
    try {
        const busboy = BusBoy({ headers: req.headers });
        let imageToUpload: Record<string, string> = {};
        let imageFileName: string;

        await new Promise((resolve, reject) => {
            busboy
                .on("close", resolve)
                .once("error", reject)
                .on("file", (_, file, info) => {
                    const { filename, mimeType } = info;
                    if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
                        return res
                            .status(400)
                            .json({ err: "File type not allowed" });
                    }

                    // my.image.png => .png
                    const imageExtension =
                        filename.split(".")[filename.split(".").length - 1];

                    imageFileName = `${Math.round(
                        Math.random() * 1000000000000000
                    )}.${imageExtension}`;

                    const filePath = path.join(os.tmpdir(), imageFileName);

                    imageToUpload = { filePath, mimeType };
                    file.pipe(fs.createWriteStream(filePath));
                    return;
                })
                .on("finish", async () => {
                    await admin
                        .storage()
                        .bucket()
                        .upload(imageToUpload.filePath, {
                            resumable: false,
                            metadata: {
                                metadata: {
                                    contentType: imageToUpload.mimeType
                                }
                            }
                        });

                    // eslint-disable-next-line max-len
                    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.STORAGE_BUCKET}/o/${imageFileName}?alt=media`;
                    await admin
                        .firestore()
                        .doc(`/users/${req.user.handle}`)
                        .update({ imageUrl });

                    return res.json({ msg: "Successfully uploaded image" });
                })
                .end(req.body);
        });

        return res.status(200);
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const addUserDetails = async (req: Request, res: Response) => {
    try {
        const userDetails = reduceUserDetails(req.body);

        if (Object.keys(userDetails).length === 0) {
            return res.json({ msg: "Updated successfully" });
        }

        await admin
            .firestore()
            .doc(`users/${req.user.handle}`)
            .update(userDetails);
        return res.json({ msg: "Updated successfully" });
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const getAuthenticatedUser = async (req: Request, res: Response) => {
    try {
        const doc = await admin
            .firestore()
            .doc(`/users/${req.user.handle}`)
            .get();

        if (doc.exists) {
            const userData: Record<string, any> = {
                credentials: doc.data(),
                likes: [],
                notifications: []
            };

            const likes = await admin
                .firestore()
                .collection("likes")
                .where("userHandle", "==", req.user.handle)
                .get();

            likes.forEach((doc) => {
                userData.likes.push(doc.data());
            });

            const notifications = await admin
                .firestore()
                .collection("notifications")
                .where("recipient", "==", req.user.handle)
                .orderBy("createdAt", "desc")
                .get();

            notifications.forEach((doc) => {
                userData.notifications.push({
                    notificationId: doc.id,
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read
                });
            });

            return res.json(userData);
        }

        return res.json(400).json({ err: "User not found" });
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const userDetails: Record<string, any> = { screams: [] };

        const userDoc = await admin
            .firestore()
            .doc(`/users/${req.params.handle}`)
            .get();
        if (!userDoc.exists) {
            return res.status(404).json({ err: "User not found" });
        }

        userDetails.user = userDoc.data();

        const userScreams = await admin
            .firestore()
            .collection("screams")
            .where("userHandle", "==", req.params.handle)
            .orderBy("createdAt", "desc")
            .get();

        userScreams.forEach((doc) => {
            userDetails.screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                createdAt: doc.data().createdAt
            });
        });

        return res.json(userDetails);
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        const batch = admin.firestore().batch();
        req.body.forEach((notificationID: string) => {
            const notification = admin
                .firestore()
                .doc(`/notifications/${notificationID}`);
            batch.update(notification, { read: true });
        });

        await batch.commit();
        return res.json({ msg: "Successfully marked notifications read" });
    } catch (err: any) {
        functions.logger.error(err);
        return res
            .status(500)
            .json({ general: "Something went wrong, please try again later" });
    }
};
