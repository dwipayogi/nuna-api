import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Groq } from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq();

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: message,
        },
        {
          role: "system",
          content:
            "Anda adalah seorang ahli psikologi. Berikan jawaban yang informatif dan mendukung dengan bahasa yang mudah dipahami. Jawab dengan bahasa Indonesia.",
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: false,
      stop: null,
    });

    const response = chatCompletion;
    res.json({
      role: "bot",
      content: response.choices[0]?.message?.content,
    });
  } catch (error) {
    console.error("Error chatting with AI:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAIRecommendations = async (req: Request, res: Response) => {
  try {
    // Mengambil userId dari user yang terotentikasi
    const userId = req.user.id;

    // Mengambil jurnal pengguna
    const journals = await prisma.journal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Mengambil 10 jurnal terbaru saja untuk analisis yang lebih relevan
    });

    if (!journals || journals.length === 0) {
      return res
        .status(404)
        .json({ message: "No journal entries found for analysis" });
    } // Mengambil data jurnal terstruktur dengan mood dan tanggal
    const journalData = journals.map((journal) => {
      return {
        date: journal.createdAt,
        title: journal.title,
        content: journal.content,
        mood: journal.mood,
      };
    });

    // Format data jurnal menjadi struktur yang lebih bermakna untuk AI
    const formattedJournalData = journalData
      .map(
        (journal) =>
          `Tanggal: ${new Date(journal.date).toLocaleDateString()}\nJudul: ${
            journal.title
          }\nMood: ${journal.mood}\nIsi: ${journal.content}`
      )
      .join("\n\n");

    // Analisis mood untuk memberikan konteks tambahan
    const moodCounts = journals.reduce<Record<string, number>>((acc, journal) => {
      acc[journal.mood] = (acc[journal.mood] || 0) + 1;
      return acc;
    }, {});

    const moodAnalysis = Object.entries(moodCounts)
      .map(([mood, count]) => `${mood}: ${count} kali`)
      .join(", ");
    // Menggabungkan semua data untuk analisis
    const formattedData = `
JURNAL PENGGUNA:
${formattedJournalData}

RINGKASAN MOOD:
${moodAnalysis}
`;
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Anda adalah seorang ahli psikologi dengan pengalaman bertahun-tahun. Berikan analisis yang mendalam dan personal tentang pola mood pengguna berdasarkan jurnal mereka. Identifikasi tren, wawasan psikologis, dan berikan rekomendasi praktis untuk menjaga kesehatan mental. Jawab dengan bahasa Indonesia yang empatik, mendukung, dan mudah dipahami.",
        },
        {
          role: "user",
          content: `Berikut adalah data jurnal saya beberapa waktu terakhir:\n\n${formattedData}\n\nTolong analisis pola mood dan keadaan psikologis saya berdasarkan jurnal-jurnal ini. Berikan wawasan tentang pola yang mungkin tidak saya sadari dan rekomendasi untuk meningkatkan kesehatan mental saya.`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7, // Menurunkan temperature agar respon lebih konsisten
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    });

    res
      .status(200)
      .json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
};
