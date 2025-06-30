import { Line } from "rc-progress";
import { useContext, useEffect, useState } from "react";
import Footer from "../../components/student/Footer";
import { AppContext } from "../../context/AppContext";
import { fetchWrapper } from "../../lib/fetchWrapper";
import toast from "react-hot-toast";

const MyEnrollments = () => {
  const {
    backendUrl,
    navigate,
    getToken,
    userData,
    enrolledCourses,
    fetchEnrolledCourses,
    calculateCourseDuration,
    calculateNoOfLectures,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);

  const getCourseProgress = async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.error("No token found, user might not be authenticated.");
        toast.error("You need to be logged in.");
        return;
      }

      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const response = await fetchWrapper(
            `${backendUrl}/api/user/get-course-progress`,
            {
              method: "POST",
              token,
              body: { courseId: course._id },
            }
          );

          if (response.statusCode === 200) {
            const totalLectures = calculateNoOfLectures(course);

            const lectureCompleted = response.data.progressData
              ? response.data.progressData.lectureCompleted.length
              : 0;

            return {
              totalLectures,
              lectureCompleted,
            };
          } else {
            console.error(response.message);
            toast.error(response.message);
          }
        })
      );

      console.log("Temp: ", tempProgressArray);

      setProgressArray(tempProgressArray);
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    }
  }, [enrolledCourses]);

  useEffect(() => {
    console.log("Progress Array: ", progressArray);
  }, []);

  return (
    <>
      <div className="md:px-36 px-8 pt-10">
        <h1 className="text-2xl font-semibold">My Enrollments</h1>

        <table className="md:table-auto table-fixed w-full overflow-hidden border mt-10">
          <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden ">
            <tr>
              <th className="px-4 py-3 font-semibold truncate">Course</th>
              <th className="px-4 py-3 font-semibold truncate">Duration</th>
              <th className="px-4 py-3 font-semibold truncate">Completed</th>
              <th className="px-4 py-3 font-semibold truncate">Status</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {enrolledCourses.map((course, index) => (
              <tr key={index} className="border-b border-gray-500/20">
                <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                  <img
                    src={course.courseThumbnail}
                    alt="Course Thumbnail"
                    className="w-14 sm:w-24 md:w-28"
                  />

                  <div className="flex-1">
                    <p className="mb-1 max-sm:text-sm">{course.courseTitle}</p>

                    <Line
                      strokeWidth={2}
                      percent={
                        progressArray[index]
                          ? (progressArray[index].lectureCompleted * 100) /
                            progressArray[index].totalLectures
                          : 0
                      }
                      className="bg-gray-300 rounded-full"
                    />
                  </div>
                </td>

                <td className="px-4 py-3 max-sm:hidden">
                  {calculateCourseDuration(course)}
                </td>

                <td className="px-4 py-3 max-sm:hidden">
                  {progressArray[index] &&
                    `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`}{" "}
                  <span>Lectures</span>
                </td>

                <td className="px-4 py-3 max-sm:text-right">
                  <button
                    className={`px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white ${
                      progressArray[index] &&
                      progressArray[index].lectureCompleted /
                        progressArray[index].totalLectures ===
                        1
                        ? "sm:px-4 px-2 "
                        : ""
                    }`}
                    onClick={() => navigate("/player/" + course._id)}
                  >
                    {progressArray[index] &&
                    progressArray[index].lectureCompleted /
                      progressArray[index].totalLectures ===
                      1
                      ? "Completed"
                      : "On Going"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollments;
