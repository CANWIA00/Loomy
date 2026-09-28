import { Request, Response } from "express";
import { fetchTcmbRates } from "../utils/tcmbRates";

export async function getTcmbRates(_req: Request, res: Response): Promise<void> {
  const result = await fetchTcmbRates();

  if (result.ok) {
    res.json(result.data);
    return;
  }

  if (result.reason === "network") {
    res.status(500).json({ message: result.message });
    return;
  }
  res.status(502).json({ message: result.message });
}
