import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all journals for the authenticated user
export const getJournals = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Manually using the right model name from our schema
    const journals = await prisma.journal.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json(journals);
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single journal by ID
export const getJournalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const journal = await prisma.journal.findUnique({
      where: {
        id,
      }
    });
    
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    // Check if the journal belongs to the authenticated user
    if (journal.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this journal' });
    }
    
    res.status(200).json(journal);
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new journal
export const createJournal = async (req: Request, res: Response) => {
  try {
    const { title, content, mood } = req.body;
    const userId = req.user.id;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const journal = await prisma.journal.create({
      data: {
        title,
        content,
        mood: mood || 'neutral',
        userId
      }
    });
    
    res.status(201).json(journal);
  } catch (error) {
    console.error('Error creating journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a journal
export const updateJournal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, mood } = req.body;
    const userId = req.user.id;
    
    // Check if journal exists and belongs to user
    const existingJournal = await prisma.journal.findUnique({
      where: {
        id
      }
    });
    
    if (!existingJournal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    if (existingJournal.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this journal' });
    }
    
    // Update the journal
    const updatedJournal = await prisma.journal.update({
      where: {
        id
      },
      data: {
        title: title || existingJournal.title,
        content: content || existingJournal.content,
        mood: mood || existingJournal.mood
      }
    });
    
    res.status(200).json(updatedJournal);
  } catch (error) {
    console.error('Error updating journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a journal
export const deleteJournal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if journal exists and belongs to user
    const existingJournal = await prisma.journal.findUnique({
      where: {
        id
      }
    });
    
    if (!existingJournal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    if (existingJournal.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this journal' });
    }
    
    // Delete the journal
    await prisma.journal.delete({
      where: {
        id
      }
    });
    
    res.status(200).json({ message: 'Journal deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};