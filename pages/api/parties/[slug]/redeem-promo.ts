import type { NextApiRequest, NextApiResponse } from "next";
import { redeemPromoCode } from "@/lib/actions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { code } = req.body || {};
    const slug = req.query.slug as string;

    if (!slug || !code) {
      return res.status(400).json({ success: false, message: "Missing slug or code" });
    }

    // Read cookie from Next.js pages API request
    const cookieKey = `party_auth_${slug}`;
    const cookieValue = req.cookies ? req.cookies[cookieKey] : undefined;

    const result = await redeemPromoCode(slug, String(code).trim());
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("Redeem promo API error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}