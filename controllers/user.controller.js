import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All Fields Are Required"
            })
        }

        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User Already Exist With This Email"
            })
        }

        // hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        await User.create({
            name,
            email,
            password: hashedPassword
        })

        return res.status(201).json({
            success: true,
            message: "Account Created Successfully"
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// login user code here

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(201).json({
                success: false,
                message: "All Fileds Are Required"
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User Does Not exist"
            })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect Email Or Password"
            })
        }

        generateToken(res, user, `Welcome Back ${user.name}`)

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed To login"
        })
    }
}


// Logout code here
export const logout = async (_, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production";

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: "None",  // cross-site allowed
            path: "/"
        };

        res.clearCookie("token", cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logout successfully."
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to logout"
        });
    }
};


export const getUserprofile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password").populate({
            path: "enrolledCourses",
            populate: {
                path: "creator",
                model: "User"
            }
        })
        if (!user) {
            return res.status(404).json({
                message: "Profile Not Found",
                success: false
            })
        }

        return res.status(200).json({
            success: true,
            user
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to load user"
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name } = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User Not Found",
                success: false
            })
        }
        // extract public id of the old image from the url is it exist;
        if (user.photoUrl) {
            const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
            deleteMediaFromCloudinary(publicId)
        }

        // upload new photo
        const cloudResponse = await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url

        const updatedData = { name, photoUrl }
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password")

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: "Profile Updated Successfully."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to Update Profile"
        })
    }
}
