const API_URL = import.meta.env.VITE_API_URL;

import { getToken } from "../../../../auth/storage";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// ✅ GET ALL
// export const getTutorialTeachers =
//   async () => {
//     const res = await fetch(
//       `${API_URL}/api/admin/tutorials`,
//       {
//         method: "GET",
//         headers: authHeaders(),
//       }
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(
//         data.message ||
//           "Failed to fetch tutorial teachers"
//       );
//     }

//     return data.data || [];
//   };
export const getTutorialTeachers = async (
  page = 1,
  limit = 20
) => {
  const res = await fetch(
    `${API_URL}/api/admin/tutorials?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
      "Failed to fetch tutorial teachers"
    );
  }

  return {
    teachers: data.data || [],
    pagination: data.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    },
  };
};

// ✅ GET SINGLE
export const getTutorialTeacherById =
  async (id) => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/${id}`,
      {
        method: "GET",
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch tutorial teacher"
      );
    }

    return data.data;
  };

// ✅ CREATE
export const createTutorialTeacher =
  async (payload) => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to create tutorial teacher"
      );
    }

    return data.data;
  };

// ✅ UPDATE
export const updateTutorialTeacher =
  async (id, payload) => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/${id}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to update tutorial teacher"
      );
    }

    return data.data;
  };

// ✅ DELETE / ARCHIVE
export const deleteTutorialTeacher =
  async (id) => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to archive tutorial teacher"
      );
    }

    return data;
  };

// ✅ TEACHERS DROPDOWN
export const getTeacherDropdown =
  async () => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/teachers/dropdown`,
      {
        method: "GET",
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch teachers"
      );
    }

    return data.data || [];
  };

// ✅ SUBJECTS DROPDOWN
export const getSubjects =
  async () => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/subjects/dropdown`,
      {
        method: "GET",
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch subjects"
      );
    }

    return data.data || [];
  };

// ✅ GRADES DROPDOWN
export const getGrades =
  async () => {
    const res = await fetch(
      `${API_URL}/api/admin/tutorials/grades/dropdown`,
      {
        method: "GET",
        headers: authHeaders(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch grades"
      );
    }

    return data.data || [];
  };