import * as admin from "firebase-admin";

import { Request, Response, NextFunction } from "express";

export const firebaseAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let token: string;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split("Bearer ")[1];
    } else {
        return res.status(403).json({ err: "Unauthorized" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;

        const userData = await admin
            .firestore()
            .collection("users")
            .where("userId", "==", req.user.uid)
            .limit(1)
            .get();

        req.user.handle = userData.docs[0].data().handle;
        req.user.imageURL = userData.docs[0].data().imageUrl;
        return next();
    } catch (err: any) {
        return res.status(400).json({ err });
    }
};
