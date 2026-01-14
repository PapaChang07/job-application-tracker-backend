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

// CORS - allow Vercel frontend and localhost for dev
const allowedOrigins = [
  "http://localhost:5173", // dev frontend
  "https://job-application-tracker-frontend-vercel-7nganep8j.vercel.app/" // prod frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin like Postman or curl
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Routes

// Get all jobs
app.get("/jobs", async (req, res) => {
  console.log("🔹 GET /jobs hit"); // log whenever route is hit
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { date: "desc" },
    });
    console.log("Fetched jobs:", jobs);
    res.json(jobs);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new job
app.post('/jobs', async (req, res) => {
  const { company, position, status, notes, date } = req.body;
  const job = await prisma.job.create({
    data: { company, position, status, notes, date: date ? new Date(date) : new Date() },
  });
  res.json(job);
});

// Update a job
app.put('/jobs/:id', async (req, res) => {
  console.log(req.params);
  const { id } = req.params;
  const { company, position, status, notes, date } = req.body;
  const job = await prisma.job.update({
    where: { id: parseInt(id) },
    data: { company, position, status, notes, date: date ? new Date(date) : undefined},
  });
  res.json(job);
});

// Delete a job
app.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.job.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Job deleted' });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
