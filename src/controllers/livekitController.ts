import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";

export const generateRandomRoomName = (length: number = 6): string => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "room-";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const createToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // From auth middleware

    const roomName = generateRandomRoomName();
    const participantName = userId;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
        // Token to expire after 10 minutes
        ttl: "10m",
      }
    );
    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();

    return res.status(200).json({
      token,
      roomName,
      participantIdentity: participantName,
    });
  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
