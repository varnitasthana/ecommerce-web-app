$ErrorActionPreference = "Stop"
Set-Location -LiteralPath "C:\Users\Varnit Asthana\OneDrive\Desktop\ecommerce-web-app"

if (-not (Test-Path -LiteralPath ".git")) {
  Write-Error "Not a git repository"
  exit 1
}

$files = @(
  ".dockerignore",
  "DEPLOYMENT.md",
  "Dockerfile",
  "README.md",
  "RAILWAY.md",
  "client/.env.production.example",
  "client/src/App.jsx",
  "client/src/pages/ForgotPassword.jsx",
  "client/src/pages/ResetPassword.jsx",
  "client/src/pages/VerifyEmail.jsx",
  "client/src/utils/formatters.js",
  "docker-compose.yml",
  "nginx/conf.d/default.conf",
  "nginx/nginx.conf",
  "railway.toml",
  "scripts/deploy-linux.sh",
  "scripts/start-production.bat",
  "server/.env.example",
  "server/config/cors.js",
  "server/middleware/logger.js",
  "server/middleware/mongoSanitize.js",
  "server/middleware/xss.js",
  "server/package-lock.json",
  "server/package.json",
  "server/server.production.js"
)

$messages = @(
  "chore: update docker ignore rules",
  "docs: update deployment documentation",
  "chore: update production Dockerfile",
  "docs: update README documentation",
  "docs: add Railway deployment guide",
  "chore: add client production environment example",
  "feat: enhance React app configuration",
  "feat: add forgot password page",
  "feat: add reset password page",
  "feat: add verify email page",
  "feat: add client formatter utilities",
  "chore: update docker compose configuration",
  "chore: add nginx default configuration",
  "chore: update nginx main configuration",
  "chore: add Railway deployment configuration",
  "chore: add Linux deployment script",
  "chore: add Windows production startup script",
  "chore: update server environment example",
  "feat: add CORS configuration",
  "feat: add request logger middleware",
  "feat: add MongoDB sanitization middleware",
  "feat: add XSS protection middleware",
  "chore: update server package lockfile",
  "chore: update server package.json",
  "feat: enhance production server configuration"
)

if ($files.Count -ne $messages.Count) {
  Write-Error "Mismatched file and message counts: files=$($files.Count), messages=$($messages.Count)"
  exit 1
}

$skipped = 0
for ($i = 0; $i -lt $files.Count; $i++) {
  $file = $files[$i]
  $message = $messages[$i]

  if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "[skip] $file does not exist"
    $skipped++
    continue
  }

  git add -- "$file"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git add failed for $file"
    exit 1
  }

  git commit -m "$message"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git commit failed for $file"
    exit 1
  }

  Write-Host "[commit] $message"
}

if ($skipped -gt 0) {
  Write-Host "Completed with $skipped skipped files."
} else {
  Write-Host "All commits completed."
}
