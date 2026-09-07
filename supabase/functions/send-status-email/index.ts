import nodemailer from "npm:nodemailer@6.9.10";

const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

const LOGO_URL = "https://zsftsxppzmebulflyhrq.supabase.co/storage/v1/object/public/assets/cds.jpg";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { to, fullName, eventTitle, status } = await req.json();

    if (!to || !eventTitle || !status) {
      return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAccepted = status === "accepted";
    const greetingName = fullName ? fullName : "";

    const subject = isAccepted
      ? `أهلًا بك في فعالية ${eventTitle} - المجتمع السعودي للمطورين`
      : `بخصوص تسجيلك في فعالية ${eventTitle} - المجتمع السعودي للمطورين`;

    const messageTitle = isAccepted ? "أهلًا بك 🎉" : "تحديث بخصوص التسجيل";

    const messageBody = isAccepted
      ? `يسرّنا ويسعدنا الترحيب بك بكل حفاوة في فعالية <strong>"${eventTitle}"</strong> ضمن فعاليات المجتمع السعودي للمطورين. تم قبول تسجيلك بنجاح، ونحن سعيدون جدًا بانضمامك إلينا وتواجدك معنا في هذا الحدث المميز</p>
          <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
          نتطلع لرؤيتك حاضرًا معنا، ونتمنى لك تجربة ممتعة ومثمرة مليئة بالفائدة والتواصل</p>
          <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
         مرحبًا بك من جديد`
      : `نتقدم بخالص الشكر والتقدير على اهتمامك بالتسجيل في فعالية <strong>"${eventTitle}"</strong>، ونعتذر بشدة عن عدم التمكن من قبول تسجيلك في هذه المرة، وذلك نظرًا لمحدودية الأماكن المتاحة وارتفاع الإقبال على الفعالية.</p>
          <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
          نقدّر تفهمك، ونتطلع بشوق لوجودك معنا في فعالياتنا القادمة، حيث نعدك بمزيد من الفعاليات المميزة قريبًا</p>
          <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
          شكرًا لك على تفاعلك ودعمك المستمر لمجتمعنا`;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Tahoma, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background-color:#286A5E;padding:0;font-size:0;line-height:0;">
        <img src="${LOGO_URL}" width="480" style="display:block;width:100%;max-width:480px;height:auto;" alt="المجتمع السعودي للمطورين" />
      </td>
    </tr>
    <tr>
      <td style="background-color:#286A5E;padding:16px 24px;text-align:center;">
        <p style="margin:0;color:#ffffff;font-size:14px;">المجتمع السعودي للمطورين</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px;">
        <h2 style="margin:0 0 16px;color:#111111;font-size:20px;text-align:right;">${messageTitle}</h2>
        <p style="margin:0 0 12px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
          أهلًا ${greetingName}،
        </p>
        <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.9;text-align:right;">
          ${messageBody}
        </p>
        <p style="margin:24px 0 0;color:#333333;font-size:14px;line-height:1.9;text-align:right;">
          فريق المجتمع السعودي للمطورين
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await new Promise((resolve, reject) => {
      transport.sendMail(
        {
          from: `"المجتمع السعودي للمطورين" <${GMAIL_USER}>`,
          to,
          subject,
          html,
        },
        (error, info) => {
          if (error) reject(error);
          else resolve(info);
        }
      );
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});