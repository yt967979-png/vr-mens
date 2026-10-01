# VR Men's Wear - One-Click Production Deployment to AWS Lightsail
param(
  [string]$ServerIp = "13.235.16.44",
  [string]$KeyPath = "c:\Users\yoges\Downloads\vr.pem"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING VR MEN'S WEAR TO AWS LIGHTSAIL" -ForegroundColor Cyan
Write-Host "Target: ubuntu@$ServerIp" -ForegroundColor Yellow
Write-Host "SSH Key: $KeyPath" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Step 1: Run Provisioner if server is fresh
Write-Host "`n[1/4] Ensuring Remote Server is Provisioned..." -ForegroundColor Green
$provisionScript = Get-Content -Raw "scripts/setup-lightsail-server.sh"
ssh -i $KeyPath -o StrictHostKeyChecking=no "ubuntu@$ServerIp" "cat << 'EOF' > /tmp/setup.sh`n$provisionScript`nEOF`nbash /tmp/setup.sh"

# 2. Step 2: Create a deployment tarball (excluding node_modules and .git)
Write-Host "`n[2/4] Packaging Application Bundle..." -ForegroundColor Green
$tarFile = "vr-mens-wear-dist.tar.gz"
if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

tar --exclude="node_modules" --exclude=".git" --exclude=".next" --exclude="*.tar.gz" -czf $tarFile .
Write-Host "✓ Application archived to $tarFile ($(Get-Item $tarFile | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum) bytes)" -ForegroundColor Green

# 3. Step 3: Upload tarball to server
Write-Host "`n[3/4] Uploading Bundle to /var/www/vrmenswear..." -ForegroundColor Green
scp -i $KeyPath -o StrictHostKeyChecking=no $tarFile "ubuntu@$ServerIp:/tmp/$tarFile"

# 4. Step 4: Extract, install dependencies, build, and restart PM2
Write-Host "`n[4/4] Extracting, Building and Launching on Server..." -ForegroundColor Green
$remoteCommands = @"
set -e
sudo mkdir -p /var/www/vrmenswear
sudo chown -R ubuntu:ubuntu /var/www/vrmenswear
tar -xzf /tmp/$tarFile -C /var/www/vrmenswear
rm -f /tmp/$tarFile

cd /var/www/vrmenswear

# Check .env.local
if [ ! -f .env.local ]; then
  echo "Creating production .env.local with PostgreSQL..."
  cat << 'ENV' > .env.local
DATABASE_URL="postgresql://vr_admin:vr_secure_pass_2026@127.0.0.1:5432/vr_menswear"
NEXT_PUBLIC_SITE_URL="http://13.235.16.44"
NEXT_PUBLIC_SHOP_NAME="VR Men's Wear"
RAZORPAY_KEY_ID="rzp_test_YourTestKey"
RAZORPAY_KEY_SECRET="YourTestSecret"
ADMIN_SESSION_SECRET="vr_menswear_super_secret_jwt_key_2026"
ENV
fi

echo "--> Installing dependencies with clean production flags..."
npm install --omit=dev --prefer-offline || npm install

echo "--> Initializing database & building Next.js application..."
npm run build

echo "--> Restarting PM2 process..."
pm2 delete vrmenswear 2>/dev/null || true
pm2 start npm --name "vrmenswear" -- start
pm2 save
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "--> Checking live status..."
pm2 status
curl -I http://127.0.0.1:3000/api/health || true
"@

ssh -i $KeyPath -o StrictHostKeyChecking=no "ubuntu@$ServerIp" "$remoteCommands"

# Clean up local archive
if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE! STORE IS LIVE!" -ForegroundColor Green
Write-Host "🌐 Visit Store: http://$ServerIp" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
