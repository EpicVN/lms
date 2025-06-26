import User from "../models/User.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// User enrollment courses with letucte links
export const getUserEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await User.findById(userId).populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
