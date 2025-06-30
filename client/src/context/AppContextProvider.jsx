import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchWrapper } from "../lib/fetchWrapper";
import { AppContext } from "./AppContext";

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch All Courses
  const fetchAllCourses = async () => {
    try {
      const response = await fetchWrapper(`${backendUrl}/api/course/all`);

      if (response.success) {
        setAllCourses(response.data.courses);
      } else {
        toast.error(response.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.log("Error fetching courses: ", error);
      toast.error(error.message);
    }
  };

  // Fetch User Data
  const fetchUserData = async () => {
    if (user.publicMetadata.role === "educator") {
      setIsEducator(true);
    }

    try {
      const token = await getToken();

      if (!token) {
        console.error("No token found, user might not be authenticated.");
        toast.error("You need to be logged in to access this data.");
        return;
      }

      const response = await fetchWrapper(`${backendUrl}/api/user/data`, {
        token,
      });

      if (response.success) {
        setUserData(response.data.user);
      } else {
        toast.error(response.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.log("Error fetching user data: ", error.message);
      toast.error(error.message);
    }
  };

  // Fetch user enrolled courses
  const fetchEnrolledCourses = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.error("No token found, user might not be authenticated.");
        toast.error("You need to be logged in to access this data.");
        return;
      }

      const response = await fetchWrapper(
        `${backendUrl}/api/user/enrolled-courses`,
        {
          token,
        }
      );

      if (response.success) {
        setEnrolledCourses(response.data.enrolledCourses.reverse());
      } else {
        toast.error(
          response.message || "Failed to fetch user enrolled courses"
        );
      }
    } catch (error) {
      console.log("Error fetching user enrolled courses: ", error.message);
      toast.error(error.message);
    }
  };

  // Calculate average rating for each course
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) {
      return 0;
    }

    let totalRating = 0;
    course.courseRatings.forEach((rating) => {
      totalRating += rating.rating;
    });

    return Math.floor(totalRating / course.courseRatings.length);
  };

  // Calculate course chapter time
  const calculateChapterTime = (chapter) => {
    let totalTime = 0;
    chapter.chapterContent.map(
      (lecture) => (totalTime += lecture.lectureDuration)
    );

    return humanizeDuration(totalTime * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate course duration
  const calculateCourseDuration = (course) => {
    let totalTime = 0;
    course.courseContent.map((chapter) =>
      chapter.chapterContent.map(
        (lecture) => (totalTime += lecture.lectureDuration)
      )
    );

    return humanizeDuration(totalTime * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate to No of lectures in the course
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent.map((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });

    return totalLectures;
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchEnrolledCourses();
    }
  }, [user]);

  const value = {
    navigate,
    backendUrl,
    currency,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    isEducator,
    setIsEducator,
    enrolledCourses,
    setEnrolledCourses,
    fetchEnrolledCourses,
    allCourses,
    fetchAllCourses,
    getToken,
    userData,
    setUserData,
    fetchUserData,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
