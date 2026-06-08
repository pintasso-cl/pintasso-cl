# pintasso-cl

Landing page for **Pintasso** — high-end painting contractor based in Temuco, Araucanía, Chile.

Visitors schedule a free on-site technical visit directly via an inline Cal.com embed. On booking confirmation, an AWS Lambda function sends a transactional confirmation email via Gmail SMTP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5 |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Scheduling | Cal.com (`@calcom/embed-react`) |
| Hosting | AWS S3 + CloudFront (OAC) |
| Email backend | AWS Lambda (Node 20) + Nodemailer → Gmail SMTP |
| API | AWS API Gateway v2 (HTTP API) |
| Infrastructure | Terraform ≥ 1.9 |
| CI/CD | GitHub Actions |
| Package manager | pnpm 9 |

---

## Project Layout

```
pintasso-cl/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Type-check on pull requests
│       └── deploy.yml      # Deploy Lambda + SPA on push to main
├── aws/
│   └── lambda/
│       ├── sendEmail.ts    # Lambda handler — Nodemailer + Gmail SMTP
│       ├── package.json
│       └── tsconfig.json
├── public/                 # Static assets (copy from existing project)
│   ├── logo.png
│   ├── before-example.jpg
│   └── after-example.jpg
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx # Full landing page + Cal.com embed
│   │   └── SuccessPage.tsx # Booking confirmation screen
│   ├── App.tsx             # React Router routes
│   ├── main.tsx            # ReactDOM entry point
│   ├── index.css           # Tailwind v4 + DaisyUI v5 theme
│   └── vite-env.d.ts       # Vite ImportMeta types
├── terraform/
│   └── main.tf             # S3 + CloudFront + Lambda + API Gateway
├── .env.example
├── index.html
├── vite.config.ts
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm i -g pnpm`
- **Terraform** ≥ 1.9 — [install](https://developer.hashicorp.com/terraform/install)
- **AWS CLI** v2 configured with credentials — `aws configure`
- A **Cal.com** account with an event type published at `pintasso-cl/visita-tecnica`
- A **Gmail** account with an [App Password](https://myaccount.google.com/apppasswords) generated (requires 2FA enabled)

---

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=https://<your-api-gateway-id>.execute-api.us-east-1.amazonaws.com
VITE_CALCOM_LINK=pintasso-cl/visita-tecnica
```

`VITE_API_URL` is the value from `terraform output api_gateway_url` after infrastructure is provisioned. For local testing you can leave it blank — the email POST is silently skipped when the URL is empty.

### 3. Copy image assets

Copy the following files from the existing Next.js project into `public/`:

```
public/logo.png
public/before-example.jpg
public/after-example.jpg
```

### 4. Run dev server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Infrastructure (Terraform)

All AWS resources are defined in `terraform/main.tf`.

### Resources provisioned

| Resource | Purpose |
|---|---|
| S3 bucket | Stores compiled SPA assets |
| CloudFront distribution | CDN + HTTPS + SPA error routing |
| CloudFront OAC | Restricts S3 access to CloudFront only |
| Lambda function | Sends confirmation emails via Gmail SMTP |
| API Gateway v2 (HTTP API) | Exposes Lambda as `POST /send-email` |
| IAM role | Least-privilege Lambda execution role |

### First-time setup

```bash
cd terraform

# Initialise providers
terraform init

# Preview changes
terraform plan \
  -var="gmail_user=you@gmail.com" \
  -var="gmail_app_password=xxxx xxxx xxxx xxxx"

# Apply (provisions all resources ~2 min)
terraform apply \
  -var="gmail_user=you@gmail.com" \
  -var="gmail_app_password=xxxx xxxx xxxx xxxx"
```

After apply, note the three outputs:

```
cloudfront_url    = "https://d1234abcd.cloudfront.net"
api_gateway_url   = "https://abc123.execute-api.us-east-1.amazonaws.com"
s3_bucket_name    = "pintasso-spa-123456789012"
```

Set `api_gateway_url` as `VITE_API_URL` in `.env.local` and in GitHub Secrets before the first deployment.

> **Tip:** Store `gmail_user` and `gmail_app_password` in a `terraform.tfvars` file (git-ignored) so you don't pass them on every command.

---

## Lambda — Build & Deploy (manual)

The Lambda source is `aws/lambda/sendEmail.ts`. It is bundled into a single file via esbuild.

```bash
cd aws/lambda
pnpm install
pnpm package          # → dist/lambda.zip
```

Then update the function:

```bash
aws lambda update-function-code \
  --function-name pintasso-send-email \
  --zip-file fileb://dist/lambda.zip
```

In normal workflow this is handled automatically by GitHub Actions.

---

## SPA — Build & Deploy (manual)

```bash
# At project root
pnpm build            # outputs to dist/

# Upload hashed assets (long cache)
aws s3 sync dist/ s3://<bucket> \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

# Upload index.html (no cache — always fresh)
aws s3 cp dist/index.html s3://<bucket>/index.html \
  --cache-control "no-cache,no-store,must-revalidate"

# Bust CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

In normal workflow this is handled automatically by GitHub Actions.

---

## CI/CD (GitHub Actions)

### On every pull request → `ci.yml`

- Type-checks the frontend (`tsc -b`)
- Type-checks the Lambda (`tsc --noEmit`)

### On push to `main` → `deploy.yml`

Two jobs run in parallel:

1. **deploy-lambda** — bundles, zips, and updates the Lambda function code
2. **deploy-spa** — builds the Vite SPA, syncs to S3, invalidates CloudFront

### Required GitHub configuration

Go to **Settings → Secrets and variables → Actions**.

**Secrets:**

| Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM key (needs S3 write, CloudFront invalidation, Lambda update) |
| `AWS_SECRET_ACCESS_KEY` | Matching secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET_NAME` | `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront console or AWS CLI |
| `LAMBDA_FUNCTION_NAME` | `pintasso-send-email` |
| `VITE_API_URL` | `terraform output api_gateway_url` |

**Variables** (non-sensitive):

| Name | Value |
|---|---|
| `VITE_CALCOM_LINK` | `pintasso-cl/visita-tecnica` |

### Commit lockfiles before first CI run

```bash
pnpm install                     # root pnpm-lock.yaml
cd aws/lambda && pnpm install    # aws/lambda/pnpm-lock.yaml
git add pnpm-lock.yaml aws/lambda/pnpm-lock.yaml
git commit -m "chore: add lockfiles"
```

---

## Booking Flow

```
User lands on page
  → scrolls to #agenda
  → Cal.com embed loads (lazy)
  → picks date/time and fills in their name/email on Cal.com
  → bookingSuccessful event fires
  → background POST to Lambda with { bookingId, name, email }
  → Lambda sends HTML confirmation email via Gmail SMTP
  → user is navigated to /success?order=<bookingId>
```

---

## Environment Variables Reference

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes (prod) | API Gateway invoke URL |
| `VITE_CALCOM_LINK` | No | Cal.com slug — defaults to `pintasso-cl/visita-tecnica` |

### Lambda (AWS environment variables — set by Terraform)

| Variable | Description |
|---|---|
| `GMAIL_USER` | Gmail sender address |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not the account password) |
