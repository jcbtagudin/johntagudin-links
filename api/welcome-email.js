// Welcome email HTML — sent to new subscribers via Resend
// {{EMAIL}} is replaced at send time in subscribe.js with encodeURIComponent(cleanEmail)
export const WELCOME_EMAIL_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>you made a good call 👋</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style type="text/css">
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; background-color: #f3f3ef; width: 100% !important; }
  * { box-sizing: border-box; }

  /* Mobile styles */
  @media screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .fluid { width: 100% !important; max-width: 100% !important; }
    .stack-column, .stack-column-center {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .stack-column { text-align: left !important; }
    .stack-column-center { text-align: center !important; }
    .mobile-padding { padding: 24px !important; }
    .mobile-center { text-align: center !important; }
    .tool-cell { display: block !important; width: 100% !important; padding-bottom: 10px !important; padding-right: 0 !important; }
  }
</style>
</head>

<body style="margin:0; padding:0; background-color:#f3f3ef; font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased;">

<!-- Full width bg -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f3ef;">
<tr>
<td align="center" style="padding: 40px 20px;">

  <!-- Email container -->
  <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="margin:0 auto;">

    <!-- ═══ MAIN CARD ═══ -->
    <tr>
      <td style="background-color:#ffffff; border-radius:20px; border:1px solid #e2e2dc; box-shadow:0 2px 24px rgba(0,0,0,0.06);">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td class="mobile-padding" style="padding:48px 44px 40px 44px;">

              <!-- Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#eaf5ee; border:1px solid #bbf7d0; border-radius:50px; padding:5px 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="6" height="6" style="width:6px; height:6px;">
                          <div style="width:6px; height:6px; background-color:#22c55e; border-radius:50%; font-size:0; line-height:0;">&#8203;</div>
                        </td>
                        <td style="padding-left:7px;">
                          <span style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#1a6b3c; letter-spacing:0.5px;">you're in</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <h1 style="font-family:Georgia,'Times New Roman',Times,serif; font-size:36px; font-weight:400; letter-spacing:-1px; line-height:1.1; color:#0c0c10; margin:0; padding:0;">
                      you made a<br>
                      <em style="font-style:italic; color:#3a3a4a;">good call.</em>
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Para 1 -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                <tr>
                  <td>
                    <p style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:300; color:#3a3a4a; line-height:1.7; margin:0; padding:0;">
                      Hey, thanks for joining.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Para 2 -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                <tr>
                  <td>
                    <p style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:300; color:#3a3a4a; line-height:1.7; margin:0; padding:0;">
                      I put together a collection of free video editing resources, tools, and finds from around the internet — stuff I discovered so you don't have to go digging yourself. You're getting free access to all of it.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px; margin-bottom:36px;">
                <tr>
                  <td style="background-color:#0c0c10; border-radius:10px;">
                    <a href="https://johntagudin.notion.site/Free-Resources-to-get-started-d3f05c92c1474e8cb923c1438aef9b63?pvs=73"
                      target="_blank"
                      style="display:inline-block; padding:14px 28px; font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:14px; font-weight:500; color:#ffffff; text-decoration:none; letter-spacing:-0.1px; border-radius:10px;">
                      Access the free resources &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="border-top:1px solid #e2e2dc; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Section label -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td>
                    <span style="font-family:'Courier New',Courier,monospace; font-size:10px; color:#7a7a90; letter-spacing:1.5px; text-transform:uppercase;">what's inside</span>
                  </td>
                </tr>
              </table>

              <!-- Tool cards — 3 column table -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <!-- Tool 1 -->
                  <td class="tool-cell" width="31%" valign="top" style="padding-right:10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background-color:#f3f3ef; border:1px solid #e2e2dc; border-radius:12px; padding:16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-size:22px; padding-bottom:10px; line-height:1;">🤖</td>
                            </tr>
                            <tr>
                              <td style="font-family:Georgia,'Times New Roman',serif; font-size:14px; font-weight:400; color:#0c0c10; padding-bottom:4px; line-height:1.3;">Free Finds</td>
                            </tr>
                            <tr>
                              <td style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:11px; color:#7a7a90; font-weight:300; line-height:1.5;">Handpicked for you</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Tool 2 -->
                  <td class="tool-cell" width="31%" valign="top" style="padding-right:10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background-color:#f3f3ef; border:1px solid #e2e2dc; border-radius:12px; padding:16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-size:22px; padding-bottom:10px; line-height:1;">⚡</td>
                            </tr>
                            <tr>
                              <td style="font-family:Georgia,'Times New Roman',serif; font-size:14px; font-weight:400; color:#0c0c10; padding-bottom:4px; line-height:1.3;">Resources</td>
                            </tr>
                            <tr>
                              <td style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:11px; color:#7a7a90; font-weight:300; line-height:1.5;">Tools &amp; guides</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Tool 3 -->
                  <td class="tool-cell" width="31%" valign="top">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background-color:#f3f3ef; border:1px solid #e2e2dc; border-radius:12px; padding:16px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-size:22px; padding-bottom:10px; line-height:1;">💸</td>
                            </tr>
                            <tr>
                              <td style="font-family:Georgia,'Times New Roman',serif; font-size:14px; font-weight:400; color:#0c0c10; padding-bottom:4px; line-height:1.3;">Shortcuts</td>
                            </tr>
                            <tr>
                              <td style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:11px; color:#7a7a90; font-weight:300; line-height:1.5;">Work smarter</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Para 3 -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                <tr>
                  <td>
                    <p style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:300; color:#3a3a4a; line-height:1.7; margin:0; padding:0;">
                      I don't send emails on a schedule. Only when I come across something actually worth your time — a free tool, a hidden resource, a shortcut I stumbled on so you don't have to go looking.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Para 4 -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:36px;">
                <tr>
                  <td>
                    <p style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:300; color:#3a3a4a; line-height:1.7; margin:0; padding:0;">
                      That's the whole deal.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e2e2dc; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Signature -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Avatar -->
                  <td width="42" valign="middle" style="padding-right:14px;">
                    <img src="https://i.ibb.co/mVnPQFq8/my-face.png"
                      width="42" height="42" alt="John Tagudin"
                      style="width:42px; height:42px; border-radius:50%; display:block; object-fit:cover;">
                  </td>
                  <!-- Name & title -->
                  <td valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Georgia,'Times New Roman',serif; font-size:15px; font-weight:400; color:#0c0c10; padding-bottom:2px; line-height:1.2;">John Tagudin</td>
                      </tr>
                      <tr>
                        <td style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#7a7a90; letter-spacing:0.2px; line-height:1.2;">Video Creator</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ═══ FOOTER ═══ -->
    <tr>
      <td align="center" style="padding:28px 20px 0;">

        <!-- Social links -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:0 8px;">
              <a href="https://tiktok.com/@john.tagudin" style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#7a7a90; text-decoration:none; letter-spacing:0.3px;">TikTok</a>
            </td>
            <td style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#d0d0c8; padding:0 2px;">&middot;</td>
            <td style="padding:0 8px;">
              <a href="https://facebook.com/johntagudin.media" style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#7a7a90; text-decoration:none; letter-spacing:0.3px;">Facebook</a>
            </td>
            <td style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#d0d0c8; padding:0 2px;">&middot;</td>
            <td style="padding:0 8px;">
              <a href="https://instagram.com/john.tagudin" style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#7a7a90; text-decoration:none; letter-spacing:0.3px;">Instagram</a>
            </td>
            <td style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#d0d0c8; padding:0 2px;">&middot;</td>
            <td style="padding:0 8px;">
              <a href="https://youtube.com/@john.tagudin" style="font-family:'Courier New',Courier,monospace; font-size:11px; color:#7a7a90; text-decoration:none; letter-spacing:0.3px;">YouTube</a>
            </td>
          </tr>
        </table>

        <!-- Unsubscribe line -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
          <tr>
            <td align="center">
              <p style="font-family:'Courier New',Courier,monospace; font-size:10px; color:#aaaaaa; letter-spacing:0.3px; line-height:1.7; margin:0; padding:0;">
                You subscribed at johntagudin.com &nbsp;&middot;&nbsp;
                <a href="https://www.johntagudin.com/api/unsubscribe?email={{EMAIL}}" style="color:#aaaaaa; text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:hello@johntagudin.com" style="color:#aaaaaa; text-decoration:underline;">hello@johntagudin.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <p style="font-family:'Courier New',Courier,monospace; font-size:10px; color:#cccccc; letter-spacing:0.2px; margin:0; padding:0;">
                &copy; 2025 John Tagudin &nbsp;&middot;&nbsp; Philippines
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>

  </table>

</td>
</tr>
</table>

</body>
</html>`
