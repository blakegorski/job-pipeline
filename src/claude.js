export async function generateFollowUp(company, role) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Write a concise, professional follow-up email for a job application. Company: ${company}. Role: ${role}. Keep it under 150 words, friendly but professional. Just the email body, no subject line.`
          }
        ]
      })
    });
    const data = await response.json();
    return data.content[0].text;
  }
  
  export async function generateInterviewPrep(company, role) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Generate 5 likely interview questions for this role. Company: ${company}. Role: ${role}. Format as a numbered list. Be specific to the role, not generic.`
          }
        ]
      })
    });
    const data = await response.json();
    return data.content[0].text;
  }