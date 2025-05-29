import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all meditation resources
export const getAllMeditations = async (req: Request, res: Response) => {
  try {
    const meditations = await prisma.meditate.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(meditations);
  } catch (error) {
    console.error("Error fetching meditations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a meditation by ID
export const getMeditationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const meditation = await prisma.meditate.findUnique({
      where: {
        id,
      },
    });

    if (!meditation) {
      return res.status(404).json({ message: "Meditation not found" });
    }

    res.status(200).json(meditation);
  } catch (error) {
    console.error("Error fetching meditation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new meditation
export const createMeditation = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      longDescription,
      duration,
      imageUrl,
      link,
      steps,
    } = req.body;

    if (!title || !description || !duration) {
      return res.status(400).json({
        message:
          "Required fields missing: title, description, and duration are required",
      });
    }

    const meditation = await prisma.meditate.create({
      data: {
        title,
        description,
        longDescription: longDescription || "",
        duration,
        imageUrl: imageUrl || "",
        link: link || null,
        steps: steps || [],
      },
    });

    res.status(201).json(meditation);
  } catch (error) {
    console.error("Error creating meditation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a meditation
export const updateMeditation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      longDescription,
      duration,
      imageUrl,
      link,
      steps,
    } = req.body;

    // Check if meditation exists
    const existingMeditation = await prisma.meditate.findUnique({
      where: {
        id,
      },
    });

    if (!existingMeditation) {
      return res.status(404).json({ message: "Meditation not found" });
    }

    // Update the meditation
    const updatedMeditation = await prisma.meditate.update({
      where: {
        id,
      },
      data: {
        title: title || existingMeditation.title,
        description: description || existingMeditation.description,
        longDescription: longDescription || existingMeditation.longDescription,
        duration: duration || existingMeditation.duration,
        imageUrl: imageUrl || existingMeditation.imageUrl,
        link: link || existingMeditation.link,
        steps: steps || existingMeditation.steps,
      },
    });

    res.status(200).json(updatedMeditation);
  } catch (error) {
    console.error("Error updating meditation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a meditation
export const deleteMeditation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if meditation exists
    const existingMeditation = await prisma.meditate.findUnique({
      where: {
        id,
      },
    });

    if (!existingMeditation) {
      return res.status(404).json({ message: "Meditation not found" });
    }

    // Delete the meditation
    await prisma.meditate.delete({
      where: {
        id,
      },
    });

    res.status(200).json({ message: "Meditation deleted successfully" });
  } catch (error) {
    console.error("Error deleting meditation:", error);
    res.status(500).json({ message: "Server error" });
  }
};
