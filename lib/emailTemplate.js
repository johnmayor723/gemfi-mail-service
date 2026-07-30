const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const row = (label, value) =>
  value
    ? `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #EEF2F1;color:#6B7280;font-size:13px;width:140px;vertical-align:top;">${label}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #EEF2F1;color:#1A1A1A;font-size:14px;">${escapeHtml(value)}</td>
      </tr>`
    : '';

export function buildOnboardingWelcomeEmailHtml({ companyName, referenceId, statusUrl }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F5F5F5;padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
            <tr>
              <td style="background:#1A1A1A;padding:28px 24px;">
                <span style="color:#FFFFFF;font-size:20px;font-weight:700;">gem</span><span style="color:#40E0D0;font-size:20px;font-weight:700;">fi</span>
                <div style="color:#9CA3AF;font-size:13px;margin-top:4px;">Partner Bank Application Received</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <p style="color:#1A1A1A;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(companyName)} team,</p>
                <p style="color:#1A1A1A;font-size:14px;line-height:1.6;margin:0 0 20px;">
                  Thanks for applying to become a GemFi partner bank. We've received your application and our team will review it shortly.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #EEF2F1;border-radius:8px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px;">
                      <div style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Reference ID</div>
                      <div style="color:#1A1A1A;font-size:18px;font-weight:700;font-family:monospace;">${escapeHtml(referenceId)}</div>
                    </td>
                  </tr>
                </table>
                <p style="color:#1A1A1A;font-size:14px;line-height:1.6;margin:0 0 20px;">
                  Keep this reference ID handy — you can use it to check your application status at any time.
                </p>
                ${
                  statusUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#40E0D0;">
                        <a href="${escapeHtml(statusUrl)}" style="display:inline-block;padding:12px 24px;color:#1A1A1A;font-size:14px;font-weight:700;text-decoration:none;">Check Application Status</a>
                      </td></tr></table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#FAFAFA;border-top:1px solid #EEF2F1;color:#9CA3AF;font-size:12px;">
                This is an automated message from GemFi. If you didn't submit this application, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export function buildContactEmailHtml({ name, email, phone, company, subject, message, submittedAt, ip }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F5F5F5;padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
            <tr>
              <td style="background:#1A1A1A;padding:20px 24px;">
                <span style="color:#FFFFFF;font-size:18px;font-weight:700;">gemfi</span>
                <span style="color:#40E0D0;font-size:18px;font-weight:700;"></span>
                <div style="color:#9CA3AF;font-size:13px;margin-top:4px;">New Contact Form Submission</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row('Name', name)}
                  ${row('Email', email)}
                  ${row('Phone', phone)}
                  ${row('Company', company)}
                  ${row('Subject', subject)}
                </table>
                <div style="margin-top:20px;">
                  <div style="color:#6B7280;font-size:13px;margin-bottom:6px;">Message</div>
                  <div style="background:#F9FAFB;border:1px solid #EEF2F1;border-radius:8px;padding:14px 16px;color:#1A1A1A;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#FAFAFA;border-top:1px solid #EEF2F1;color:#9CA3AF;font-size:12px;">
                Submitted ${escapeHtml(submittedAt)}${ip ? ` · from ${escapeHtml(ip)}` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}
