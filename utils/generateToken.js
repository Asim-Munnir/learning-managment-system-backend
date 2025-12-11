import jwt from "jsonwebtoken"

export const generateToken = (res, user, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

    if (!token) {
        return res.status(201).json({
            success: false,
            message: "Smeting Went Wrong During Generating Jwt Token"
        })
    }

    return res.status(200)
        .cookie("token", token, {
            httpOnly: true,
            secure: true,      // deploy environment me HTTPS ke liye
            sameSite: 'none',  // cross-origin allowed
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        })
        .json({
            success: true,
            message,
            user
        });

}