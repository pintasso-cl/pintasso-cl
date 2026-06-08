terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Uncomment to use a remote state backend (recommended for teams):
  # backend "s3" {
  #   bucket = "your-tf-state-bucket"
  #   key    = "pintasso/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# ── Variables ─────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short identifier used in resource names"
  type        = string
  default     = "pintasso"
}

variable "gmail_user" {
  description = "Gmail address used as the SMTP sender (stored only in Lambda env)"
  type        = string
  sensitive   = true
}

variable "gmail_app_password" {
  description = "Gmail App Password — generate at myaccount.google.com/apppasswords"
  type        = string
  sensitive   = true
}

# ── Data ──────────────────────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}

# ── S3 bucket (SPA assets) ────────────────────────────────────────────────────

resource "aws_s3_bucket" "spa" {
  bucket = "${var.project_name}-spa-${data.aws_caller_identity.current.account_id}"
  tags   = { Project = var.project_name }
}

resource "aws_s3_bucket_public_access_block" "spa" {
  bucket                  = aws_s3_bucket.spa.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── CloudFront Origin Access Control ─────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "spa" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── S3 bucket policy — allows only CloudFront (OAC) to read objects ───────────

data "aws_iam_policy_document" "spa_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.spa.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.spa.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "spa" {
  bucket     = aws_s3_bucket.spa.id
  policy     = data.aws_iam_policy_document.spa_bucket.json
  depends_on = [aws_s3_bucket_public_access_block.spa]
}

# ── CloudFront distribution ───────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "s3-spa"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-spa"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA routing: serve index.html for any 404/403 so React Router handles paths
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = { Project = var.project_name }
}

# ── Lambda IAM role ───────────────────────────────────────────────────────────

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = { Project = var.project_name }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ── Lambda deployment package ─────────────────────────────────────────────────
#
# Pre-requisite: run the following once before `terraform apply`:
#   cd aws/lambda && pnpm install && pnpm build
# This produces aws/lambda/dist/index.js which is zipped here.

data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambda/dist/index.js"
  output_path = "${path.module}/../aws/lambda/dist/lambda.zip"
}

# ── Lambda function ───────────────────────────────────────────────────────────

resource "aws_lambda_function" "send_email" {
  function_name    = "${var.project_name}-send-email"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30

  environment {
    variables = {
      GMAIL_USER         = var.gmail_user
      GMAIL_APP_PASSWORD = var.gmail_app_password
    }
  }

  tags = { Project = var.project_name }
}

# ── API Gateway v2 (HTTP API) ─────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  # Restrict CORS to the CloudFront distribution domain
  cors_configuration {
    allow_headers = ["Content-Type"]
    allow_methods = ["POST", "OPTIONS"]
    allow_origins = ["https://${aws_cloudfront_distribution.spa.domain_name}"]
    max_age       = 300
  }

  tags = { Project = var.project_name }
}

resource "aws_apigatewayv2_integration" "send_email" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.send_email.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "send_email" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /send-email"
  target    = "integrations/${aws_apigatewayv2_integration.send_email.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
  tags        = { Project = var.project_name }
}

# Allow API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_email.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "cloudfront_url" {
  description = "Public URL of the SPA — use as the site domain"
  value       = "https://${aws_cloudfront_distribution.spa.domain_name}"
}

output "api_gateway_url" {
  description = "Set this value as VITE_API_URL in the frontend .env before building"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "s3_bucket_name" {
  description = "Upload `dist/` contents here after `npm run build`"
  value       = aws_s3_bucket.spa.id
}
