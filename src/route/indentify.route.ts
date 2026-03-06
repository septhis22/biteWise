import Express from "express";
import { identifyContact } from "../service/identify.service.ts";

const router = Express.Router();

router.post("/identify", Express.json(), async (req, res) => {
  const { email, phoneNumber } = req.body ?? {};

  if (!email && !phoneNumber) {
    res.status(400).json({ error: "email or phoneNumber is required" });
    return;
  }

  try {
    const result = await identifyContact({ email, phoneNumber });
    res.status(200).json({ data: result });
  } catch (error) {
    console.error("error identifying user", error);
    res.status(500).json({ error: "failed to identify user" });
  }
});

export default router;
