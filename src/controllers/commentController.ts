import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all comments for a post
export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, postId } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Use transaction to create comment and update post's comment count
    const [comment, _] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          postId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (existingComment.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: {
        id,
      },
      data: {
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const existingComment = await prisma.comment.findUnique({
      where: {
        id,
      },
    });

    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow comment deletion by comment owner or post owner
    const post = await prisma.post.findUnique({
      where: {
        id: existingComment.postId,
      },
    });

    if (existingComment.userId !== userId && post?.userId !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this comment",
      });
    }

    // Delete the comment and update post comment count in a transaction
    await prisma.$transaction([
      prisma.comment.delete({
        where: {
          id,
        },
      }),
      prisma.post.update({
        where: { id: existingComment.postId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};
