# PowerShell script to add environment variables to Vercel
# Usage: ./setup-vercel-env.ps1

Write-Host "Setting up Vercel Environment Variables from server/.env..." -ForegroundColor Cya

# Read the .env file
$envFile = "server/.env"
if (-Not (Test-Path $envFile)) {
    Write-Host "Error: $envFile not found!" -ForegroundColor Red
    exit 1
}

# Parse .env file
$lines = Get-Content $envFile
foreach ($line in $lines) {
    if ($line -match "^#" -or $line -match "^\s*$") {
        continue
    }

    # Split key and value
    $parts = $line.Split("=", 2)
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()

        # Check if PORT (we skip PORT for Vercel as it's handled automatically)
        if ($key -eq "PORT") { continue }

        Write-Host "Adding $key to Vercel (Production/Preview/Development)..." -ForegroundColor Yellow
        
        # Use vercel env add command. The 'echo' trick is needed for interactive prompts on Linux, 
        # but on Windows PowerShell we might need to pipe input differently if it prompts.
        # However, vercel env add <name> [environment] < <file> is not supported directly in PS.
        # We will try passing the value as an argument if supported, or piping.
        
        # Try piping the value to the command
        $value | vercel env add $key production 
        $value | vercel env add $key preview
        $value | vercel env add $key development
    }
}

# Ensure MAILJET_API_KEY and MAILJET_SECRET_KEY are added to Vercel
$lines += "MAILJET_API_KEY=$($env:MAILJET_API_KEY)"
$lines += "MAILJET_SECRET_KEY=$($env:MAILJET_SECRET_KEY)"

Write-Host "Done! Please verify in Vercel Dashboard." -ForegroundColor Green
Write-Host "You must REDEPLOY for changes to take effect." -ForegroundColor Cyan
Write-Host "Run: vercel --prod" -ForegroundColor Yellow
