import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { deleteMediaFromCloudinary, deleteVideoFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
    try {
        const { courseTitle, category } = req.body;
        console.log(courseTitle, category)

        if (!courseTitle || !category) {
            return res.status(400).json({
                message: "Course Title and category are required",
                success: false
            })
        }

        const course = await Course.create({
            courseTitle,
            category,
            creator: req.user._id
        })

        return res.status(201).json({
            success: true,
            message: "Course Created.",
            course
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to create course",
            success: false
        })
    }
}

export const searchCourse = async (req, res) => {
    try {
        const {query = "", categories = [], sortByPrice= ""} = req.query;

        // create search query
        const searchCriteria = {
            isPublished: true,
            $or:[
                {courseTitle: {$regex:query, $options:"i"}},
                {subTitle: {$regex:query, $options:"i"}},
                {category: {$regex:query, $options:"i"}}
            ]
        }

        // if categories are selected, add them to filter
        if (categories.length > 0) {
            searchCriteria.category = {$in: categories}
        }

        // define sorting order
        const sortOptions = {}
        if (sortByPrice === "low") {
            sortOptions.coursePrice = 1; // sort by price in ascedig oeder
        } else if(sortByPrice === "high") {
            sortOptions.coursePrice = -1; // desending order
        }

        let courses = await Course.find(searchCriteria).populate({path:"creator", select: "name photoUrl"}).sort(sortOptions)
        return res.status(200).json({
            success: true,
            courses: courses || []
        })
        
    } catch (error) {
        console.log(error)
    }
}


// Get All Published Courses

export const getPublishedCourse = async (_, res) => {
    try {
        const courses = await Course.find({isPublished: true}).populate({path:"creator", select:"name photoUrl"})
        if (!courses) {
            return res.status(404).json({
                message: "Course Not Found",
                success: false
            })
        }

        return res.status(200).json({
            courses,
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to get Published courses",
            success: false
        })
    }
}

// get Creator Courses by id

export const getCreatorCourses = async (req, res) => {
    try {
        const userId = req.user._id;
        const courses = await Course.find({ creator: userId })

        if (!courses) {
            return res.status(404).json({
                success: false,
                courses: [],
                message: "Course Not found"
            })
        }

        return res.status(200).json({
            success: true,
            courses
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to fetch courses",
            success: false
        })
    }
}


export const editCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { courseTitle, subTitle, description, category, courseLevel, coursePrice } = req.body;
        const thumbnail = req.file;

        let course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course Not Found",
                success: false
            })
        }

        // upload a thumbnail on cloudinary

        let courseThumbnail;
        if (thumbnail) {
            if (course.courseThumbnail) {
                const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
                await deleteMediaFromCloudinary(publicId) // delete old image
            }
            courseThumbnail = await uploadMedia(thumbnail.path)
        }


        const updateData = { courseTitle, subTitle, description, category, courseLevel, coursePrice, courseThumbnail: courseThumbnail?.secure_url }
        course = await Course.findByIdAndUpdate(courseId, updateData, { new: true })

        return res.status(200).json({
            course,
            message: "Course Updated Successfully",
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to Edit course",
            success: false
        })
    }
}


export const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course not found...!",
                success: false
            })
        }

        return res.status(200).json({
            message: "Course Found",
            course
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to get course by Id",
            success: false
        })
    }
}


export const createLecture = async (req, res) => {
    try {
        const {lectureTitle} = req.body;
        const courseId = req.params.courseId;

        if (!lectureTitle || !courseId) {
            return res.status(400).json({
                message: "Lecture Title and courseId is required",
                success: false
            })
        }

        const lecture = await Lecture.create({lectureTitle})
        const course = await Course.findById(courseId);
        if (course) {
            course.lectures.push(lecture._id)
            await course.save()
        }

        return res.status(201).json({
            lecture,
            message: "Lecture created successfully"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to Create Lecture",
            success: false
        })
    }
}

export const getCourseLecture = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId).populate("lectures")
        if (!course) {
            return res.status(404).json({
                message: "Course not found",
                success: false
            })
        }

        return res.status(200).json({
            lectures: course.lectures,
            message: "lecture fetch successfully",
            success: true
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to Get Lecture",
            success: false
        })
    }
}


export const editLecture = async (req, res) => {
    try {
        const {lectureTitle, videoInfo, isPreviewFree} = req.body;
        const {courseId, lectureId} = req.params

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({
                message: "lecture not found",
                success: false
            })
        }

        if(lectureTitle) lecture.lectureTitle = lectureTitle;
        if(videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl
        if(videoInfo?.publicId) lecture.publicId = videoInfo.publicId
        lecture.isPreviewFree = isPreviewFree

        await lecture.save()

        // ensure the course still has the lecture id if it was not already add
        const course = await Course.findById(courseId);
        if (course && !course.lectures.includes(lecture._id)) {
            course.lectures.push(lecture._id)
            await course.save()
        }

        return res.status(200).json({
            success: true,
            message: "Lecture Updated Successfully",
            lecture
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to update Lecture",
            success: false
        })
    }
}

export const removeLecture = async (req, res) => {
    try {
        const lectureId = req.params.lectureId;
        const lecture = await Lecture.findByIdAndDelete(lectureId)
        if (!lecture) {
            return res.status(404).json({
                success: false,
                message: "lecture not found"
            })
        }
        
        // delete the lecture video from cloudinary
        if (lecture.publicId) {
            await deleteVideoFromCloudinary(lecture.publicId)
        }

        //  remove the lecture reference from assosiated course
        
        await Course.updateOne(
            {lectures: lectureId }, // find the course that contains the lecture
            {$pull: {lectures: lectureId}} // remove the lectureId from the lectures array
        )

        return res.status(200).json({
            success : true,
            message: "Lecture Removed Successfully"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to remove Lecture",
            success: false
        })
    }
}

export const getLecturebyId = async (req, res) => {
    try {
        const lectureId = req.params.lectureId
        const lecture = await Lecture.findById(lectureId)
        if (!lecture) {
            return res.status(404).json({
                success: false,
                message: "Lecture not found"
            })
        }

        return res.status(200).json({
            success: true,
            lecture
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to get Lecture by Id",
            success: false
        })
    }
}

// publish unpublish course logic
export const togglePublishCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId
        const {publish} = req.query; // true, false
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course Not Found...!",
                success: false
            })
        }

        // public status based on the query parameter
        course.isPublished = publish === "true";
        await course.save()

        const statusMessage = course.isPublished ? "Published" : "Unpublished"
        return res.status(200).json({
            message: `Course is ${statusMessage}`
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to Update Status",
            success: false
        })
    }
}