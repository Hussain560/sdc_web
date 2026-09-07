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
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, fullName, eventTitle } = await req.json();

    if (!to || !eventTitle) {
      return new Response(JSON.stringify({ error: "بيانات ناقصة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Tahoma, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#286A5E;padding:0;font-size:0;line-height:0;">
                    <img src="https://zsftsxppzmebulflyhrq.supabase.co/storage/v1/object/public/assets/cds.jpg" alt="المجتمع السعودي للمطورين" width="480" style="display:block;width:100%;max-width:480px;height:auto;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background-color:#286A5E;padding:10px 24px 28px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;">المجتمع السعودي للمطورين</span>
                    <p style="margin:6px 0 0;color:#eafff2;font-size:12px;">نبني مستقبل التقنية معًا</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 24px;text-align:right;">
                    <p style="margin:0 0 20px;font-size:15px;line-height:1.9;color:#333333;">
                      أهلًا بك ${fullName || ""}،
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#444444;">
                      تم استلام طلب تسجيلك في فعالية <strong>"${eventTitle}"</strong> بنجاح. سيتم مراجعة الطلب من قِبل اللجنة المختصة، وسيصلك إشعار عند اعتماد التسجيل.
                    </p>
                    <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 20px;">
                    <p style="margin:0;font-size:14px;color:#333333;">
                      شكرًا لاهتمامك،<br>
                      <strong>فريق المجتمع السعودي للمطورين</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await new Promise((resolve, reject) => {
      transport.sendMail(
        {
          from: `"المجتمع السعودي للمطورين" <${GMAIL_USER}>`,
          to,
          subject: `تم استلام تسجيلك في فعالية ${eventTitle}`,
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