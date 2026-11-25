export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const prompt =
      body.message ||
      body.prompt ||
      body.question ||
      body.text ||
      (Array.isArray(body.messages) && body.messages.length
        ? body.messages[body.messages.length - 1]?.content ||
          body.messages[body.messages.length - 1]?.text
        : "");

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Empty prompt" });
    }

    const systemInstruction =
      "Bạn là trợ lý học tập hỗ trợ người dùng trên nền tảng Học tập, kiểm tra nhận thức chính trị – Vững bước chuyển đổi số. Hãy trả lời rõ ràng, ngắn gọn, chính xác bằng tiếng Việt.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: String(prompt) }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API error"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "Xin lỗi, hiện chưa có câu trả lời phù hợp.";

    return res.status(200).json({
      reply,
      message: reply,
      answer: reply
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
