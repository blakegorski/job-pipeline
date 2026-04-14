async function callAI(type, company, role) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, company, role })
  });
  const data = await response.json();
  return data.text;
}

export const generateFollowUp = (company, role) => callAI("followup", company, role);
export const generateInterviewPrep = (company, role) => callAI("prep", company, role);