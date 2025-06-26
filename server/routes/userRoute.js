import express from "express";
import {
  getUserData,
  getUserEnrolledCourses,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/data", getUserData);
userRouter.get("/enrolled-courses", getUserEnrolledCourses);

export default userRouter;
