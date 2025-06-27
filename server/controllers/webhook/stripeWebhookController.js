import Stripe from "stripe";
import Purchase from "../../models/Purchase.js";
import User from "../../models/User.js";
import Course from "../../models/Course.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log(error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      // Purchase data
      const purchaseId = paymentIntent.metadata.purchaseId;
      const purchaseData = await Purchase.findById(purchaseId);

      if (!purchaseData) {
        console.log("Purchase not found");
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      // User data of the purchase
      const userId = purchaseData.userId;
      const userData = await User.findById(userId);

      if (!userData) {
        console.log("User not found");
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Course data of the purchase
      const courseId = purchaseData.courseId.toString();
      const courseData = await Course.findById(courseId);

      if (!courseData) {
        console.log("Course not found");
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      // Check if the user is already enrolled in the course
      const existingPurchase = await Purchase.findOne({ userId, courseId });

      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: "You have already purchased this course.",
        });
      }

      // Update course enrolled students
      courseData.enrolledStudents.push(userData._id);
      await courseData.save();

      // Update user enrolled courses
      userData.enrolledCourses.push(courseData._id);
      await userData.save();

      // Update purchase status
      purchaseData.status = "completed";
      await purchaseData.save();

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      // Purchase data
      const purchaseId = paymentIntent.metadata.purchaseId;
      const purchaseData = await Purchase.findById(purchaseId);

      if (!purchaseData) {
        console.log("Purchase not found");
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      purchaseData.status = "failed";
      await purchaseData.save();

      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return res.json({ received: true });
};
