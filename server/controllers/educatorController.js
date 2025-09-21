import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";

// Update user role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "educator",
      },
    });

    return res.status(200).json({
      success: true,
      message: "You can now pubblish your courses",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
    console.log(error);
  }
};

// Add new course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;

    if (!courseData) {
      return res.status(400).json({
        success: false,
        message: "Course data is missing",
      });
    }

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail not attached",
      });
    }

    const parsedCourseData = await JSON.parse(courseData);

    parsedCourseData.educator = educatorId;

    const newCourse = await Course.create(parsedCourseData);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    newCourse.courseThumbnail = imageUpload.secure_url;

    await newCourse.save();

    return res.status(201).json({
      success: true,
      message: "Course Added",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Course id is required" });
    }

    if (!courseData) {
      return res
        .status(400)
        .json({ success: false, message: "Course data is missing" });
    }

    const parsedCourseData = await JSON.parse(courseData);

    // Ensure educator can only update their own course
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (String(course.educator) !== String(educatorId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this course",
        });
    }

    // If a new image is provided, upload and replace thumbnail
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path);
      parsedCourseData.courseThumbnail = imageUpload.secure_url;
    }

    // Update fields present in payload
    course.courseTitle = parsedCourseData.courseTitle ?? course.courseTitle;
    course.courseDescription =
      parsedCourseData.courseDescription ?? course.courseDescription;
    course.coursePrice = parsedCourseData.coursePrice ?? course.coursePrice;
    course.discount = parsedCourseData.discount ?? course.discount;
    if (parsedCourseData.hasOwnProperty("isPublished")) {
      course.isPublished = parsedCourseData.isPublished;
    }
    if (parsedCourseData.courseThumbnail) {
      course.courseThumbnail = parsedCourseData.courseThumbnail;
    }
    if (Array.isArray(parsedCourseData.courseContent)) {
      course.courseContent = parsedCourseData.courseContent;
    }

    await course.save();

    return res.status(200).json({ success: true, message: "Course Updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const educatorId = req.auth.userId;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Course id is required" });
    }

    if (!educatorId) {
      return res
        .status(400)
        .json({ success: false, message: "Educator id is required" });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (String(course.educator) !== String(educatorId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this course",
        });
    }

    await course.deleteOne();

    return res.status(200).json({ success: true, message: "Course Deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// duplicate removed

// Get All Courses
export const getEducatorCourse = async (req, res) => {
  try {
    const educator = req.auth.userId;

    const courses = await Course.find({ educator });

    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get educator dashboard data (Total earning, enrolled students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId;

    if (!educator) {
      return res.status(400).json({
        success: false,
        message: "Educator not found",
      });
    }

    const courses = await Course.find({ educator });

    const totalCourses = courses.length;

    const courseIds = courses.map((course) => course._id);

    // Calculate total earnings from completed purchases
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    });

    const totalEarnings = purchases.reduce(
      (sum, purchase) => sum + purchase.amount,
      0
    );

    // Collect unique enrolled students IDs with their course titles
    const data = await Promise.all(
      courses.map(async (course) => {
        const students = await User.find(
          {
            _id: { $in: course.enrolledStudents },
          },
          "name imageUrl"
        );

        return students.map((student) => ({
          courseTitle: course.courseTitle,
          student,
        }));
      })
    );

    const enrolledStudentsData = data.flat();

    return res.status(200).json({
      success: true,
      dashboardData: {
        totalEarnings,
        enrolledStudentsData,
        totalCourses,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId;

    if (!educator) {
      return res.status(400).json({
        success: false,
        message: "Educator not found",
      });
    }

    const courses = await Course.find({ educator });

    const courseIds = courses.map((course) => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    })
      .populate("userId", "name imageUrl")
      .populate("courseId", "courseTitle");

    const enrolledStudents = purchases.map((purchase) => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt,
    }));

    return res.status(200).json({
      success: true,
      enrolledStudents,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
