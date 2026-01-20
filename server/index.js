import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances in dev/hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const PORT = process.env.PORT || 5000;

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// CORS - allow Vercel frontend and localhost for dev
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, Railway health checks)
    if (!origin) return callback(null, true);


    // Allow ALL Vercel deployments (preview + prod)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    
    if (origin.startsWith("chrome-extension://")) {
      return callback(null, true);
    }

    if (origin === "http://localhost:3000") return callback(null, true);
    
    if (origin === "http://localhost:5173") return callback(null, true); // if using Vite

    // Otherwise block
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

app.options("/", cors(corsOptions));

app.use((req, res, next) => {
  console.log("INCOMING:", req.method, req.url, "CT:", req.headers["content-type"]);
  next();
});

app.use(express.json());

app.use((err, req, res, next) => {
  console.error("MIDDLEWARE ERROR:", err);
  res.status(err.status || 500).send(err.message || "Server error");
});

// Routes

// Get all jobs
app.get("/jobs", asyncHandler(async (req, res) => {
  console.log("🔹 GET /jobs hit"); // log whenever route is hit
  const jobs = await prisma.job.findMany({
    orderBy: { date: "desc" },
  });
  console.log("Fetched jobs:", jobs);
  res.json(jobs);
}));

// Add a new job
app.post('/jobs', asyncHandler(async (req, res) => {
  if (!req.body.company || !req.body.position ||!req.body.status ||!req.body.date) {
    return res.status(400).json({
      error: "Company, position, status, or date are required"
    });
  }
  const { company, position, status, notes, date } = req.body;
  
  const job = await prisma.job.create({
    data: { company, position, status, notes, date: date ? new Date(date) : new Date() },
  });
  res.json(job);
}));

// Update a job
app.put('/jobs/:id', asyncHandler(async (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  const { company, position, status, notes, date } = req.body;
  const job = await prisma.job.update({
    where: { id: parseInt(id) },
    data: { company, position, status, notes, date: date ? new Date(date) : undefined},
  });
  res.json(job);
}));

// Delete a job
app.delete('/jobs/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.job.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Job deleted' });
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
