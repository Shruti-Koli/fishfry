import jwt from "jsonwebtoken";

export const createToken = (user) => {
    const token = jwt.sign(
        { sub: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
    return { token };
};
