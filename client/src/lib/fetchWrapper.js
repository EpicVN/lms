// lib/fetchWrapper.js

export async function fetchWrapper(
  endpoint,
  { token, body, ...customConfig } = {}
) {
  const isFormData = body instanceof FormData;

  const headers = isFormData
    ? {}
    : {
        "Content-Type": "application/json",
      };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...(customConfig.headers || {}),
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(endpoint, config);
    const contentType = res.headers.get("content-type");

    const responseData = contentType?.includes("application/json")
      ? await res.json()
      : await res.text();

    // Kiểm tra nếu response không thành công
    if (!res.ok) {
      const error = new Error(responseData?.message || "Something went wrong");
      error.statusCode = res.status;
      error.data = responseData;
      throw error;
    }

    return {
      success: responseData.success,
      statusCode: res.status,
      message: responseData?.message || "",
      data: responseData,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
