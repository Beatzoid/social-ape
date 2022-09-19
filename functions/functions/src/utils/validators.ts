export const isEmpty = (string: string) => {
    return string.trim().length === 0;
};

export const isEmail = (email: string) => {
    const regex =
        // eslint-disable-next-line no-useless-escape
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return email.match(regex);
};

export const validateSignup = (newUser: Record<string, string>) => {
    const errors: Record<string, string> = {};

    if (isEmpty(newUser.handle)) errors.handle = "Handle is required";

    if (isEmpty(newUser.email)) {
        errors.email = "Email is required";
    } else if (!isEmail(newUser.email)) {
        errors.email = "Email must be a valid email";
    }

    if (isEmpty(newUser.password)) errors.password = "Password is required";

    if (newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = "Passwords must match";
    }

    return errors;
};

export const validateLogin = (userCredentials: Record<string, string>) => {
    const errors: Record<string, string> = {};

    if (isEmpty(userCredentials.email)) errors.email = "Email is required";
    if (isEmpty(userCredentials.password)) {
        errors.password = "Password is required";
    }

    return errors;
};
