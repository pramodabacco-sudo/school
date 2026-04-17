// // // server/server.js
// // server/server.js
// import "dotenv/config";

// import { createServer } from "http";
// import { Server } from "socket.io";

// import "./src/utils/redis.js";
// import app from "./src/app.js";   // login related
// import staff from "./src/staff.js";
// import finance from "./src/finance.js";
// import student from "./src/student.js";
// import parent from "./src/parent.js";
// import gpsRoutes from "./src/gps-ingestion/gps.routes.js";
// import paymentRoutes from "./src/payment/payment.routes.js";
// import cors from "cors";

// const PORT = process.env.PORT || 5000;

// // ✅ CORS (simple + correct)
// app.use(cors({
//   origin: true,
//   credentials: true
// }));

// // ✅ IMPORTANT: manually ensure headers (fixes Render/browser edge cases)
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (origin) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

//   // handle preflight quickly
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });

// app.use(staff);
// app.use(student);
// app.use(finance);  
// app.use("/api/parent", parent); 
// app.use("/api/device", gpsRoutes);
// app.use("/api/payment", paymentRoutes);

// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// global.io = io;

// io.on("connection", (socket) => {
//   const userId = socket.handshake.auth?.userId;

//   if (userId) {
//     socket.join(String(userId));
//   }
// });

// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });




import "dotenv/config";

import { createServer } from "http";
import { Server } from "socket.io";

import "./src/utils/redis.js";
import app from "./src/app.js";   // login related
import staff from "./src/staff.js";
import finance from "./src/finance.js";
import student from "./src/student.js";
import parent from "./src/parent.js";
import gpsRoutes from "./src/gps-ingestion/gps.routes.js";
import paymentRoutes from "./src/payment/payment.routes.js";
import cors from "cors";

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://school-crm-r5dq.onrender.com",
    "https://www.eduabaccotech.com",  // ✅ correct one
    "https://eduabaccotech.com"       // ✅ add non-www too
  ],
  credentials: true
}));

app.use(staff);
app.use(student);
app.use(finance);  
app.use("/api/parent",parent); 
app.use("/api/device", gpsRoutes);

app.use("/api/payment", paymentRoutes);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});



// 
global.io = io;

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (userId) {
    socket.join(String(userId));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});