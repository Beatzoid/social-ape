interface User {
    uid: string;
    handle?: string;
}

declare namespace Express {
    interface Request {
        user: User;
    }
}
