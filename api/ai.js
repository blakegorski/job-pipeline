export const config = { runtime: "edge" };

export default async function handler(req) {
  const { type, company, role } = await req.json();

  const prompt = type === "followup"
    ? `Write a concise, professional follow-up email for a job application. Company: ${company}. Role: ${role}. Keep it under 150 words, friendly but professional. Just the email body, no subject line.`
    : `Generate 5 likely interview questions for this role. Company: ${company}. Role: ${role}. Format as a numbered list. Be specific to the role, not generic.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;

  return new Response(JSON.stringify({ text }), {
    headers: { "Content-Type": "application/json" }
  });
}