import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { buildContactEmailHtml, buildOnboardingWelcomeEmailHtml } from './lib/emailTemplate.js';

const PORT = process.env.PORT || 5000;
const HONEYPOT_FIELD = 'company_website';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(pinoHttp({ logger }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

function validateContactPayload(body) {
  const errors = [];
  const required = ['name', 'email', 'subject', 'message'];

  for (const field of required) {
    if (!body[field] || !String(body[field]).trim()) {
      errors.push(`"${field}" is required.`);
    }
  }
  if (body.email && !EMAIL_RE.test(String(body.email).trim())) {
    errors.push('"email" must be a valid email address.');
  }
  return errors;
}

function validateOnboardingWelcomePayload(body) {
  const errors = [];
  const required = ['companyName', 'email', 'referenceId'];

  for (const field of required) {
    if (!body[field] || !String(body[field]).trim()) {
      errors.push(`"${field}" is required.`);
    }
  }
  if (body.email && !EMAIL_RE.test(String(body.email).trim())) {
    errors.push('"email" must be a valid email address.');
  }
  return errors;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/contact', contactLimiter, async (req, res) => {
  const body = req.body || {};

  // Honeypot: bots fill every field, including hidden ones. Silently accept
  // without sending mail so the bot doesn't learn its submission was rejected.
  if (body[HONEYPOT_FIELD]) {
    req.log.warn({ ip: req.ip }, 'contact form honeypot triggered');
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  }

  const errors = validateContactPayload(body);
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  const { name, email, phone, company, subject, message } = body;
  const submittedAt = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

  try {
    await transporter.sendMail({
      from: `"gemfi Website" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `[gemfi Contact] ${subject}`,
      html: buildContactEmailHtml({
        name,
        email,
        phone,
        company,
        subject,
        message,
        submittedAt,
        ip: req.ip,
      }),
    });

    req.log.info({ email, subject }, 'contact email sent');
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    req.log.error({ err: err.message, email, subject }, 'contact email failed to send');
    return res.status(502).json({ success: false, message: 'Unable to send message.' });
  }
});

// Internal, service-to-service only — called by onboarding-service after a
// successful application submission. Not called from a browser, so this
// deliberately skips CORS and instead gates on a shared secret.
app.post('/onboarding-welcome', onboardingLimiter, async (req, res) => {
  const providedSecret = req.get('X-Internal-Auth');
  if (!process.env.INTERNAL_MAIL_SECRET || providedSecret !== process.env.INTERNAL_MAIL_SECRET) {
    req.log.warn({ ip: req.ip }, 'onboarding-welcome called with invalid internal secret');
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const body = req.body || {};
  const errors = validateOnboardingWelcomePayload(body);
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  const { companyName, email, referenceId, statusUrl } = body;

  try {
    await transporter.sendMail({
      from: `"gemfi" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: 'Welcome to GemFi — Your Application Reference',
      html: buildOnboardingWelcomeEmailHtml({ companyName, referenceId, statusUrl }),
    });

    req.log.info({ email, referenceId }, 'onboarding welcome email sent');
    return res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    req.log.error({ err: err.message, email, referenceId }, 'onboarding welcome email failed to send');
    return res.status(502).json({ success: false, message: 'Unable to send email.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err: err.message }, 'unhandled error');
  res.status(500).json({ success: false, message: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  logger.info(`gemfi mail-service listening on port ${PORT}`);
});
