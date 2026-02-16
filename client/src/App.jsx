import "./App.css";
import { getAuth } from "./auth/storage";
import Login from "./auth/Login";

import AdminRoutes from "./admin/Routes";
import StudentRoutes from "./student/Routes";
import SuperAdminRoutes from "./superAdmin/Routes";
import TeacherRoutes from "./teacher/Routes";
import ParentRoutes from "./parent/Routes";

function App() {
  const auth = getAuth();

  // not logged in
  if (!auth) {
    return <Login />;
  }

  // student login
  if (auth.accountType === "student") {
    return <StudentRoutes />;
  }

  // parent login
  if (auth.accountType === "parent") {
    return <ParentRoutes />;
  }

  // staff login → check role
  if (auth.accountType === "staff") {
    if (auth.role === "ADMIN") {
      return <AdminRoutes />;
    }

    if (auth.role === "TEACHER") {
      return <TeacherRoutes />;
    }

    if (auth.role === "SUPER_ADMIN") {
      return <SuperAdminRoutes />;
    }
  }

  // fallback
  return <Login />;
}

export default App;
