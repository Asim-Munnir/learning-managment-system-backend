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

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,    // must be true in production for cross-site
        sameSite: "none",        // cross-site cookie allowed
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    };

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
        success: true,
        message,
        user,
    });

}