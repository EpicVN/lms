import express from "express";
import {
  addCourse,
  educatorDashboardData,
  getEducatorCourse,
  getEnrolledStudentsData,
  updateRoleToEducator,
  updateCourse,
  deleteCourse,
} from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import protectEducator from "../middleware/authMiddleware.js";

const educatorRouter = express.Router();

educatorRouter.get("/update-role", updateRoleToEducator);
educatorRouter.post(
  "/add-course",
  upload.single("image"),
  protectEducator,
  addCourse
);
educatorRouter.put(
  "/course/:id",
  upload.single("image"),
  protectEducator,
  updateCourse
);
educatorRouter.delete(
  "/course/:id",
  protectEducator,
  deleteCourse
);
educatorRouter.get("/courses", protectEducator, getEducatorCourse);
educatorRouter.get("/dashboard", protectEducator, educatorDashboardData);
educatorRouter.get(
  "/enrolled-students",
  protectEducator,
  getEnrolledStudentsData
);

export default educatorRouter;
