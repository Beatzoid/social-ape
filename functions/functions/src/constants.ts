import * as firebase from "firebase/app";

import { getAuth } from "firebase/auth";

export const firebaseApp = firebase.initializeApp({
    apiKey: `${process.env.API_KEY}`,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_OD,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
});

export const auth = getAuth(firebaseApp);
