/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { collection, where, query, getDocs, limit } from "firebase/firestore";

import { admin, db } from "./admin";

// Make sure the user is authenticated with firebase
// and if they're not don't allow them to access
// whatever route their trying to access
export const FBAuth = (req: Request, res: Response, next: NextFunction) => {
    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else {
        console.error("No token found");
        return res.status(403).json({ error: "Unauthorized" });
    }

    admin
        .auth()
        .verifyIdToken(idToken, true)
        .then(async (decodedToken) => {
            req.user = decodedToken as any;

            const userQuery = query(
                collection(db, "users"),
                where("userId", "==", req.user.uid),
                limit(1)
            );
            const data = await getDocs(userQuery);

            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch((err) => {
            return res.status(403).json(err);
        });

    return;
};
