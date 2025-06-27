import express from "express";
import {
  addUserRating,
  getUserCourseProgress,
  getUserData,
  getUserEnrolledCourses,
  purchaseCourse,
  updateUserCourseProgress,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/data", getUserData);
userRouter.get("/enrolled-courses", getUserEnrolledCourses);
userRouter.post("/purchase", purchaseCourse);
userRouter.post("/update-course-progress", updateUserCourseProgress);
userRouter.get("/get-course-progress", getUserCourseProgress);
userRouter.get("/add-rating", addUserRating);

export default userRouter;
