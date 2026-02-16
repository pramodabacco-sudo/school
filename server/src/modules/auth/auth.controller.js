//server\src\modules\auth\auth.controller.js
import { loginStaff, loginStudent, loginParent } from "./auth.service.js";

// STAFF LOGIN
export const staffLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginStaff(email, password);

    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// STUDENT LOGIN
export const studentLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginStudent(email, password);

    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// PARENT LOGIN
export const parentLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginParent(email, password);

    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
