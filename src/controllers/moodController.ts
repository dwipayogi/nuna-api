import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new mood entry
export const createMoodEntry = async (req: Request, res: Response) => {
  try {
    const { mood } = req.body;
    const userId = req.user.id; // From auth middleware

    // Check for active mood entries for this user
    const activeMood = await prisma.moodHistory.findFirst({
      where: {
        userId,
        endTime: null
      }
    });

    // If there's an active mood, update it with end time and duration
    if (activeMood) {
      const endTime = new Date();
      const startTime = new Date(activeMood.startTime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      await prisma.moodHistory.update({
        where: { id: activeMood.id },
        data: {
          endTime,
          durationMinutes
        }
      });
    }

    // Create new mood entry
    const newMood = await prisma.moodHistory.create({
      data: {
        mood,
        userId,
        startTime: new Date()
      }
    });

    res.status(201).json(newMood);
  } catch (error) {
    console.error("Error creating mood entry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active mood for a user
export const getActiveMood = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const activeMood = await prisma.moodHistory.findFirst({
      where: {
        userId,
        endTime: null
      }
    });

    if (!activeMood) {
      return res.status(404).json({ message: "No active mood found" });
    }

    res.status(200).json(activeMood);
  } catch (error) {
    console.error("Error fetching active mood:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update mood entry (end time and duration)
export const updateMoodEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;
    const userId = req.user.id;

    // Check if mood entry exists and belongs to the user
    const moodEntry = await prisma.moodHistory.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!moodEntry) {
      return res.status(404).json({ message: "Mood entry not found" });
    }

    const end = endTime ? new Date(endTime) : new Date();
    const start = new Date(moodEntry.startTime);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    const updatedMood = await prisma.moodHistory.update({
      where: { id },
      data: {
        endTime: end,
        durationMinutes
      }
    });

    res.status(200).json(updatedMood);
  } catch (error) {
    console.error("Error updating mood entry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get mood history for a user
export const getMoodHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit, offset } = req.query;

    const moodHistory = await prisma.moodHistory.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined
    });

    res.status(200).json(moodHistory);
  } catch (error) {
    console.error("Error fetching mood history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get mood statistics for a user
export const getMoodStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { days } = req.query;
    
    // Default to 7 days if not specified
    const daysPeriod = days ? parseInt(days as string) : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysPeriod);

    const moodHistory = await prisma.moodHistory.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate
        },
        endTime: {
          not: null
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Calculate total time for each mood
    const moodStats: Record<string, { totalMinutes: number, percentage: number, count: number }> = {};
    let totalMinutes = 0;

    moodHistory.forEach(entry => {
      if (entry.durationMinutes) {
        if (!moodStats[entry.mood]) {
          moodStats[entry.mood] = { totalMinutes: 0, percentage: 0, count: 0 };
        }
        moodStats[entry.mood].totalMinutes += entry.durationMinutes;
        moodStats[entry.mood].count += 1;
        totalMinutes += entry.durationMinutes;
      }
    });

    // Calculate percentage for each mood
    if (totalMinutes > 0) {
      Object.keys(moodStats).forEach(mood => {
        moodStats[mood].percentage = (moodStats[mood].totalMinutes / totalMinutes) * 100;
      });
    }

    res.status(200).json({
      period: `${daysPeriod} days`,
      totalMinutes,
      stats: moodStats,
      history: moodHistory
    });

  } catch (error) {
    console.error("Error fetching mood statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
};