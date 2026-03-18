// server/server.js
import "dotenv/config";

import "./src/utils/redis.js";
import app from "./src/app.js";   // login related
import staff from "./src/staff.js";
import finance from "./src/finance.js";
import student from "./src/student.js";
import parent from "./src/parent.js";

const PORT = process.env.PORT || 5000;

app.use(staff);
app.use(student);
app.use(finance);  
app.use("/api/parent",parent); 


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});