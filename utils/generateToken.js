import jwt from "jsonwebtoken"

export const generateToken = (res, user, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

    if (!token) {
        return res.status(201).json({
            success: false,
            message: "Smeting Went Wrong During Generating Jwt Token"
        })
    }

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/", //  ye zaroori hai
        maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        message,
        user,
    });

}