import express from "express";
import {
  getUserData,
  getUserEnrolledCourses,
  purchaseCourse,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/data", getUserData);
userRouter.get("/enrolled-courses", getUserEnrolledCourses);
userRouter.post("/purchase", purchaseCourse);

export default userRouter;
