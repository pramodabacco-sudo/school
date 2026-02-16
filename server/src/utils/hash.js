//server\src\utils\hash.js
import bcrypt from "bcrypt";

// hash password before saving to DB
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// compare login password with DB password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
