import { clerkClient } from "@clerk/express"

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
