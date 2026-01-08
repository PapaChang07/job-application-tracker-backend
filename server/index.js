import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
