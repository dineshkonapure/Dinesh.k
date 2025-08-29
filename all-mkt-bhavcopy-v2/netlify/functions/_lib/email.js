
export async function sendEmailSummary({ to, subject, html }){
  const key = process.env.RESEND_API_KEY; if(!key) return { sent:false, reason:"RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify({ from:"no-reply@all-mkt-builder.netlify.app", to:[to], subject, html })
  });
  const js = await res.json().catch(()=>({}));
  return { sent: res.ok, response: js };
}
