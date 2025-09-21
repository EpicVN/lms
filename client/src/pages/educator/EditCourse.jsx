import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loading from "../../components/student/Loading";
import { AppContext } from "../../context/AppContext";
import { fetchWrapper } from "../../lib/fetchWrapper";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Save,
} from "lucide-react";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken, backendUrl } = useContext(AppContext);

  const [courseData, setCourseData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState({});

  const validateTitle = (value) => {
    const message = !value?.trim() ? "Course title is required" : undefined;
    setErrors((prev) => ({ ...prev, courseTitle: message }));
    return !message;
  };

  const validateDescription = (value) => {
    const message = !value?.trim()
      ? "Course description is required"
      : undefined;
    setErrors((prev) => ({ ...prev, courseDescription: message }));
    return !message;
  };

  const validatePrice = (value) => {
    const invalid = value === "" || Number(value) <= 0;
    const message = invalid ? "Price must be greater than 0" : undefined;
    setErrors((prev) => ({ ...prev, coursePrice: message }));
    return !message;
  };

  // Course basic info
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);

  // Chapters and lectures
  const [chapters, setChapters] = useState([]);

  // Fetch course data
  const fetchCourseData = async () => {
    try {
      const response = await fetchWrapper(
        `${backendUrl}/api/course/${courseId}`
      );

      if (response.success) {
        const data = response.data.courseData;
        setCourseData(data);
        const initTitle = data.courseTitle || "";
        const initDesc = data.courseDescription || "";
        const initPrice = data.coursePrice || 0;
        setCourseTitle(initTitle);
        setCourseDescription(initDesc);
        setCoursePrice(initPrice);
        setDiscount(data.discount || 0);
        setCourseThumbnail(data.courseThumbnail || "");
        // Normalize chapters to local editable structure
        const normalizedChapters = (data.courseContent || []).map((ch) => ({
          id: ch.chapterId,
          chapterName: ch.chapterTitle,
          lectures: (ch.chapterContent || []).map((lec) => ({
            id: lec.lectureId,
            lectureTitle: lec.lectureTitle,
            duration: lec.lectureDuration,
            lectureUrl: lec.lectureUrl,
            isPreviewFree: lec.isPreviewFree,
          })),
        }));
        setChapters(normalizedChapters);

        // Initialize validation state
        validateTitle(initTitle);
        validateDescription(initDesc);
        validatePrice(initPrice);
      } else {
        toast.error(response.message || "Failed to fetch course data");
      }
    } catch (error) {
      console.log("Error fetching course data: ", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, []);

  // Add new chapter
  const addChapter = () => {
    const newChapter = {
      id: Date.now().toString(),
      chapterName: "",
      lectures: [],
    };
    setChapters([...chapters, newChapter]);
  };

  // Update chapter name
  const updateChapterName = (chapterId, newName) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, chapterName: newName }
          : chapter
      )
    );
  };

  // Delete chapter
  const deleteChapter = (chapterId) => {
    setChapters(chapters.filter((chapter) => chapter.id !== chapterId));
  };

  // Add lecture to chapter
  const addLecture = (chapterId) => {
    const newLecture = {
      id: Date.now().toString(),
      lectureTitle: "",
      duration: "",
      lectureUrl: "",
      isPreviewFree: false,
    };

    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, lectures: [...chapter.lectures, newLecture] }
          : chapter
      )
    );
  };

  // Update lecture
  const updateLecture = (chapterId, lectureId, field, value) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lectures: chapter.lectures.map((lecture) =>
                lecture.id === lectureId
                  ? { ...lecture, [field]: value }
                  : lecture
              ),
            }
          : chapter
      )
    );
  };

  // Delete lecture
  const deleteLecture = (chapterId, lectureId) => {
    setChapters(
      chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lectures: chapter.lectures.filter(
                (lecture) => lecture.id !== lectureId
              ),
            }
          : chapter
      )
    );
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCourseThumbnail(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Save course
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();

      // Validate required fields
      const newErrors = {};
      if (!courseTitle?.trim()) newErrors.courseTitle = "Course title is required";
      if (!courseDescription?.trim()) newErrors.courseDescription = "Course description is required";
      if (coursePrice === "" || Number(coursePrice) <= 0)
        newErrors.coursePrice = "Price must be greater than 0";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fill in all required fields");
        return;
      }

      // Map local state back to backend schema
      const coursePayload = {
        courseTitle,
        courseDescription,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters.map((chapter, chIndex) => ({
          chapterId: chapter.id || String(Date.now() + chIndex),
          chapterOrder: chIndex + 1,
          chapterTitle: chapter.chapterName,
          chapterContent: chapter.lectures.map((lecture, lIndex) => ({
            lectureId: lecture.id || String(Date.now() + chIndex + lIndex),
            lectureTitle: lecture.lectureTitle,
            lectureDuration: Number(lecture.duration) || 0,
            lectureUrl: lecture.lectureUrl,
            isPreviewFree: Boolean(lecture.isPreviewFree),
            lectureOrder: lIndex + 1,
          })),
        })),
      };

      const formData = new FormData();
      formData.append("courseData", JSON.stringify(coursePayload));
      if (thumbnailFile) {
        formData.append("image", thumbnailFile);
      }

      const response = await fetchWrapper(
        `${backendUrl}/api/educator/course/${courseId}`,
        {
          method: "PUT",
          token,
          body: formData,
        }
      );

      if (response.success) {
        toast.success("Course updated successfully!");
        navigate("/educator/my-courses");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getToken();
      const resp = await fetchWrapper(
        `${backendUrl}/api/educator/course/${courseId}`,
        {
          method: "DELETE",
          token,
        }
      );
      if (resp.success) {
        toast.success("Course deleted");
        navigate("/educator/my-courses");
      } else {
        toast.error(resp.message || "Failed to delete course");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete course");
    } finally {
      setShowDeleteModal(false);
    }
  };

  return courseData ? (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/educator/my-courses")}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 mr-auto"
              >
                Delete
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Course Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Course Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Course Title */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title
                </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => {
                  const v = e.target.value;
                  setCourseTitle(v);
                  validateTitle(v);
                }}
                onBlur={(e) => validateTitle(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.courseTitle ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter course title"
              />
              {errors.courseTitle && (
                <p className="mt-1 text-xs text-red-600">{errors.courseTitle}</p>
              )}
              </div>

              {/* Course Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description *
                </label>
              <textarea
                value={courseDescription}
                onChange={(e) => {
                  const v = e.target.value;
                  setCourseDescription(v);
                  validateDescription(v);
                }}
                onBlur={(e) => validateDescription(e.target.value)}
                  rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.courseDescription ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="Describe what students will learn in this course"
                />
              {errors.courseDescription && (
                <p className="mt-1 text-xs text-red-600">{errors.courseDescription}</p>
              )}
              </div>

              {/* Price and Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Price ($) *
                </label>
              <input
                type="number"
                value={coursePrice}
                onChange={(e) => {
                  const v = e.target.value;
                  setCoursePrice(v);
                  validatePrice(v);
                }}
                onBlur={(e) => validatePrice(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.coursePrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="0"
                min="0"
              />
              {errors.coursePrice && (
                <p className="mt-1 text-xs text-red-600">{errors.coursePrice}</p>
              )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Thumbnail
                </label>
                <div className="flex items-center space-x-4">
                  {courseThumbnail && (
                    <img
                      src={courseThumbnail}
                      alt="Course thumbnail"
                      className="w-32 h-20 object-cover rounded-md border border-gray-300"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {courseThumbnail
                        ? "Change Thumbnail"
                        : "Upload Thumbnail"}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters and Lectures */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Course Content
              </h2>
              <button
                onClick={addChapter}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No chapters added yet. Click "Add Chapter" to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {chapters.map((chapter, chapterIndex) => (
                  <div
                    key={chapter.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 mr-4">
                        <input
                          type="text"
                          value={chapter.chapterName}
                          onChange={(e) =>
                            updateChapterName(chapter.id, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          placeholder={`Chapter ${chapterIndex + 1} Title`}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => addLecture(chapter.id)}
                          className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Lecture
                        </button>
                        <button
                          onClick={() => deleteChapter(chapter.id)}
                          className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Lectures */}
                    {chapter.lectures.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No lectures in this chapter yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chapter.lectures.map((lecture, lectureIndex) => (
                          <div
                            key={lecture.id}
                            className="bg-gray-50 rounded-md p-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Lecture Title */}
                              <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Lecture Title
                                </label>
                                <input
                                  type="text"
                                  value={lecture.lectureTitle}
                                  onChange={(e) =>
                                    updateLecture(
                                      chapter.id,
                                      lecture.id,
                                      "lectureTitle",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter lecture title"
                                />
                              </div>

                              {/* Duration */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Duration (min)
                                </label>
                                <input
                                  type="number"
                                  value={lecture.duration}
                                  onChange={(e) =>
                                    updateLecture(
                                      chapter.id,
                                      lecture.id,
                                      "duration",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                  min="0"
                                />
                              </div>

                              {/* Is Preview Free */}
                              <div className="flex items-center">
                                <label className="flex items-center text-xs text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={lecture.isPreviewFree}
                                    onChange={(e) =>
                                      updateLecture(
                                        chapter.id,
                                        lecture.id,
                                        "isPreviewFree",
                                        e.target.checked
                                      )
                                    }
                                    className="mr-2 rounded border-gray-300"
                                  />
                                  Preview Free
                                </label>
                              </div>

                              {/* Lecture URL */}
                              <div className="md:col-span-2 lg:col-span-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Lecture URL
                                </label>
                                <input
                                  type="url"
                                  value={lecture.lectureUrl}
                                  onChange={(e) =>
                                    updateLecture(
                                      chapter.id,
                                      lecture.id,
                                      "lectureUrl",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="https://example.com/video"
                                />
                              </div>
                            </div>

                            {/* Delete Lecture Button */}
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() =>
                                  deleteLecture(chapter.id, lecture.id)
                                }
                                className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete Lecture
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete course?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              This action cannot be undone. All course data will be permanently
              deleted.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    <Loading />
  );
};

export default EditCourse;
