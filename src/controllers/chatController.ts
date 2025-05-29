import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Groq } from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq();

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Fetch user's recent journals
    const journals = await prisma.journal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Get 5 most recent journals
    });

    // Fetch user's recent mood history
    const moodHistory = await prisma.moodHistory.findMany({
      where: {
        userId,
      },
      orderBy: {
        startTime: "desc",
      },
      take: 10, // Get 10 most recent mood records
    });

    // Format journal data
    const journalData = journals.map((journal) => {
      return {
        date: new Date(journal.createdAt).toLocaleDateString(),
        title: journal.title,
        content:
          journal.content.substring(0, 100) +
          (journal.content.length > 100 ? "..." : ""),
        mood: journal.mood,
      };
    });

    // Format mood history data
    const moodData = moodHistory.map((mood) => {
      return {
        mood: mood.mood,
        date: new Date(mood.startTime).toLocaleDateString(),
        duration: mood.durationMinutes || "Tidak diketahui",
      };
    });

    // Create context for AI based on user data
    let userContext = "";

    if (journals.length > 0 || moodHistory.length > 0) {
      userContext = `
KONTEKS PENGGUNA:

${
  journals.length > 0
    ? `JURNAL TERBARU:
${journalData.map((j) => `- ${j.date}: ${j.mood} - ${j.title}`).join("\n")}`
    : ""
}

${
  moodHistory.length > 0
    ? `RIWAYAT MOOD:
${moodData
  .map((m) => `- ${m.date}: ${m.mood} (${m.duration} menit)`)
  .join("\n")}`
    : ""
}
`;
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
            "Anda adalah seorang ahli psikologi. Berikan jawaban yang informatif dan mendukung dengan bahasa yang mudah dipahami. Jawab dengan bahasa Indonesia. Jika pengguna memiliki data jurnal atau mood, gunakan informasi ini untuk memberikan jawaban yang lebih personal dan kontekstual." +
            userContext,
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
    const moodCounts = journals.reduce<Record<string, number>>(
      (acc, journal) => {
        acc[journal.mood] = (acc[journal.mood] || 0) + 1;
        return acc;
      },
      {}
    );

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
            "Anda adalah seorang ahli psikologi dengan pengalaman bertahun-tahun. Berikan analisis yang mendalam dan personal tentang pola mood pengguna berdasarkan jurnal mereka. Identifikasi tren, wawasan psikologis, dan berikan rekomendasi praktis untuk menjaga kesehatan mental. Jawab dengan bahasa Indonesia singkat dan mudah dipahami.",
        },
        {
          role: "user",
          content: `Berikut adalah data jurnal saya beberapa waktu terakhir:\n\n${formattedData}\n\nTolong analisis pola mood dan keadaan psikologis saya berdasarkan jurnal-jurnal ini. Berikan wawasan tentang pola yang mungkin tidak saya sadari dan rekomendasi untuk meningkatkan kesehatan mental saya. Buatkan jawaban yang singkat dan ringkas tanpa bertele-tele`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7, // Menurunkan temperature agar respon lebih konsisten
      max_tokens: 1024,
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

export const getPatternAnalysis = async (req: Request, res: Response) => {
  try {
    // Get authenticated user ID
    const userId = req.user.id;

    // Fetch user's journals
    const journals = await prisma.journal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Get the 20 most recent journal entries
    });

    if (!journals || journals.length === 0) {
      return res
        .status(404)
        .json({ message: "No journal entries found for analysis" });
    }

    // Get user's mood history
    const moodHistory = await prisma.moodHistory.findMany({
      where: {
        userId,
        endTime: { not: null }, // Only completed mood entries
      },
      orderBy: {
        startTime: "desc",
      },
      take: 30, // Last 30 mood records
    });

    // Format journal data for analysis
    const journalData = journals.map((journal) => {
      return {
        date: journal.createdAt,
        title: journal.title,
        content: journal.content,
        mood: journal.mood,
      };
    });

    // Format mood history data
    const moodData = moodHistory.map((mood) => {
      return {
        mood: mood.mood,
        startTime: mood.startTime,
        endTime: mood.endTime,
        durationMinutes: mood.durationMinutes,
      };
    });

    // Create prompt for AI analysis
    const userDataPrompt = `
ANALISIS DATA PENGGUNA:

DATA JURNAL (${journals.length} entri):
${journalData
  .map(
    (j) =>
      `Tanggal: ${new Date(j.date).toLocaleDateString()}, Mood: ${j.mood}
   Judul: ${j.title}
   Konten: ${j.content.substring(0, 100)}${j.content.length > 100 ? "..." : ""}`
  )
  .join("\n\n")}

DATA MOOD (${moodHistory.length} rekaman):
${moodData
  .map(
    (m) =>
      `Mood: ${m.mood}, 
   Waktu mulai: ${new Date(m.startTime).toLocaleString()}, 
   Waktu selesai: ${
     m.endTime ? new Date(m.endTime).toLocaleString() : "Active"
   }, 
   Durasi: ${m.durationMinutes || "N/A"} menit`
  )
  .join("\n\n")}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Anda adalah seorang ahli analisis data dan psikologi. Analisis data pengguna untuk menemukan pola dan korelasi menarik. Identifikasi 3 pola penting yang terkait dengan produktivitas, mood, kebiasaan tidur, atau aktivitas lainnya. Output harus dalam format bullet points seperti ini:\n- Anda lebih produktif di pagi hari, terutama setelah kegiatan olahraga.\n- Mood Anda cenderung menurun setelah menghabiskan waktu di media sosial lebih dari 1 jam.\n- Ada korelasi positif antara waktu tidur yang cukup dan tingkat energi Anda. Jawab langsung dengan points tanpa ada kalimat tambahan di awal maupun akhir.",
        },
        {
          role: "user",
          content: `Tolong analisis data pengguna berikut dan temukan 3 pola atau korelasi penting:\n\n${userDataPrompt}\n\nBerikan output dalam format bullet points seperti contoh sistem. Gunakan bahasa Indonesia yang mudah dipahami.`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: false,
      stop: null,
    });

    // Format the response
    const patterns =
      chatCompletion.choices[0]?.message?.content ||
      "Tidak ada pola yang terdeteksi.";

    res.status(200).json({ patterns });
  } catch (error) {
    console.error("Error generating pattern analysis:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProgressAnalysis = async (req: Request, res: Response) => {
  try {
    // Get authenticated user ID
    const userId = req.user.id;

    // Get days parameter or default to 30 days
    const days = parseInt(req.query.days as string) || 30;

    // Calculate the date from X days ago
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Fetch user's journals within the period
    const journals = await prisma.journal.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get user's mood history within the period
    const moodHistory = await prisma.moodHistory.findMany({
      where: {
        userId,
        startTime: {
          gte: fromDate,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (
      (!journals || journals.length === 0) &&
      (!moodHistory || moodHistory.length === 0)
    ) {
      return res.status(404).json({
        message:
          "Tidak ada data jurnal atau mood dalam periode yang dipilih untuk analisis",
      });
    }

    // Analyze positive mood trends from journals
    const positiveMoods = ["Hebat", "Baik"];

    // Count positive mood entries per week
    const journalsByWeek = journals.reduce((acc, journal) => {
      const weekStart = new Date(journal.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!acc[weekKey]) {
        acc[weekKey] = { total: 0, positive: 0 };
      }

      acc[weekKey].total += 1;
      if (positiveMoods.includes(journal.mood)) {
        acc[weekKey].positive += 1;
      }

      return acc;
    }, {} as Record<string, { total: number; positive: number }>);

    // Get mood distribution from mood history
    const moodDistribution = moodHistory.reduce((acc, mood) => {
      if (!acc[mood.mood]) {
        acc[mood.mood] = 0;
      }

      // If we have duration, add it, otherwise count as 1 entry
      if (mood.durationMinutes) {
        acc[mood.mood] += mood.durationMinutes;
      } else {
        acc[mood.mood] += 1;
      }

      return acc;
    }, {} as Record<string, number>);

    // Calculate total and positive percentages
    const totalMoodMinutes = Object.values(moodDistribution).reduce(
      (sum, val) => sum + val,
      0
    );
    const positiveMoodPercentage =
      (positiveMoods.reduce((sum, mood) => {
        return sum + (moodDistribution[mood] || 0);
      }, 0) /
        (totalMoodMinutes || 1)) *
      100;

    // Check for first and last week data to calculate growth
    const weekKeys = Object.keys(journalsByWeek).sort();
    let growthPercentage = 0;

    if (weekKeys.length >= 2) {
      const firstWeek = journalsByWeek[weekKeys[0]];
      const lastWeek = journalsByWeek[weekKeys[weekKeys.length - 1]];

      const firstWeekPercentage = (firstWeek.positive / firstWeek.total) * 100;
      const lastWeekPercentage = (lastWeek.positive / lastWeek.total) * 100;

      growthPercentage = lastWeekPercentage - firstWeekPercentage;
    } else if (positiveMoodPercentage > 50) {
      // If we don't have enough weeks, use mood data if positive
      growthPercentage = positiveMoodPercentage - 50; // Assume baseline of 50%
    }

    // Round to nearest integer
    growthPercentage = Math.round(growthPercentage);

    // Generate response message based on growth percentage
    let message = "";

    if (growthPercentage > 0) {
      message = `Dalam ${days} hari terakhir, terdapat peningkatan ${growthPercentage}% dalam catatan mood positif Anda. Ini menunjukkan perkembangan yang baik dalam kesejahteraan mental Anda.`;
    } else if (growthPercentage < 0) {
      message = `Dalam ${days} hari terakhir, terdapat penurunan ${Math.abs(
        growthPercentage
      )}% dalam catatan mood positif Anda. Pertimbangkan untuk melakukan aktivitas yang dapat meningkatkan mood Anda.`;
    } else {
      message = `Dalam ${days} hari terakhir, mood Anda relatif stabil. Pertahankan kebiasaan baik yang telah Anda lakukan.`;
    }

    // Return the progress analysis
    res.status(200).json({
      period: `${days} hari`,
      growthPercentage:
        growthPercentage > 0 ? `+${growthPercentage}%` : `${growthPercentage}%`,
      message,
      positiveMoodPercentage: Math.round(positiveMoodPercentage),
    });
  } catch (error) {
    console.error("Error generating progress analysis:", error);
    res.status(500).json({ message: "Server error" });
  }
};
