interface User {
    uid: string;
    handle?: string;
    imageURL?: string;
}

declare namespace Express {
    interface Request {
        user: User;
    }
}
