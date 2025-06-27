import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";

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

// Purchase course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const existingPurchase = await Purchase.findOne({ userId, courseId });
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You have already purchased this course.",
      });
    }

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: (
        courseData.coursePrice -
        (courseData.discount * courseData.coursePrice) / 100
      ).toFixed(2),
    };

    const newPurchase = await Purchase.create(purchaseData);

    // Stripe Gateway Integration
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const currency = process.env.CURRENCY.toLowerCase() || "usd";

    // Create line items to for stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.floor(newPurchase.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course purchased successfully",
      session_url: session.url,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
