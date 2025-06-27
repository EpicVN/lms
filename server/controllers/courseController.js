import Course from "../models/Course.js";

// get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" });

    return res.status(200).json({
      success: true,
      courses: courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get course by id
export const getCourseId = async (req, res) => {
  const { id } = req.params;

  try {
    const courseData = await Course.findById(id).populate({
      path: "educator",
    });

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove lecture URLs for non-preview lectures
    courseData.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

    return res.status(200).json({
      success: true,
      courseData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

