import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all posts (public)
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get posts by user ID
export const getPostsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.user.id;

    const posts = await prisma.post.findMany({
      where: {
        userId,
      },
      include: {
        comments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a post by ID
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: {
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
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags: tags || [],
        userId,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a post
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (existingPost.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: {
        id,
      },
      data: {
        title: title || existingPost.title,
        content: content || existingPost.content,
        tags: tags || existingPost.tags,
      },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (existingPost.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Delete all comments related to the post first
    await prisma.comment.deleteMany({
      where: {
        postId: id,
      },
    });

    // Delete the post
    await prisma.post.delete({
      where: {
        id,
      },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
};
