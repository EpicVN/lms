import { clerkClient } from "@clerk/express";

// Middleware
const protectEducator = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata.role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default protectEducator;