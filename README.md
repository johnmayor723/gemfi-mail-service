# gemfi Mail Service

Standalone Express + Nodemailer service that handles the gemfi website's
Contact form. Runs independently of the static React site — it never ships
SMTP credentials to the browser.

```
React Website  ->  POST /contact  ->  Mail Service (Express)  ->  Nodemailer  ->  SMTP  ->  Company Inbox
```

## Setup

```bash
npm install
cp .env.example .env
# fill in SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / MAIL_TO
npm run dev
```

The service listens on `PORT` (default `5000`).

## SMTP providers

**Zoho Mail**
```
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=you@yourdomain.com
SMTP_PASS=<Zoho app-specific password>
```

**Gmail**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<Google App Password, not your account password>
```

## API

### `POST /contact`

Request body:
```json
{
  "name": "",
  "email": "",
  "phone": "",
  "company": "",
  "subject": "",
  "message": ""
}
```
`name`, `email`, `subject`, and `message` are required; `phone` and `company`
are optional.

Responses:
```json
{ "success": true, "message": "Message sent successfully." }
```
```json
{ "success": false, "message": "Unable to send message." }
```

Also included:
- Rate limiting: 5 requests / 15 minutes per IP on `/contact` (`429` when exceeded).
- Honeypot spam field: the frontend includes a hidden `company_website` input;
  if it arrives populated, the request is silently accepted without sending mail.
- Structured logging (pino) to stdout and `logs/mail-service.log` for every
  successful and failed send.

## Running under PM2

```bash
npm install -g pm2   # if not already installed
pm2 start ecosystem.config.cjs
pm2 save
```

## Nginx

The React site is served as static files. `/contact` is both the React
"Contact Us" page route *and* the mail service's API path, so the two are
told apart by HTTP method: `POST /contact` goes to this service (which
should be bound to `localhost` only, not exposed directly to the internet);
any other request to `/contact` (a direct page load or refresh) falls
through to the SPA:

```nginx
server {
    listen 80;
    server_name gemfitech.com;

    root /var/www/gemfi/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location = /contact {
        if ($request_method = POST) {
            proxy_pass http://127.0.0.1:5000/contact;
        }
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        try_files /index.html =404;
    }
}
```
