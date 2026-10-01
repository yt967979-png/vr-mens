#!/usr/bin/env bash
set -e

echo "=========================================="
echo "⚡ PROVISIONING VR MEN'S WEAR PRODUCTION SERVER"
echo "=========================================="

# 1. Setup 2GB Swap (Essential for 1GB RAM instances to prevent OOM)
if [ ! -f /swapfile ]; then
  echo "--> Creating 2GB Swapfile..."
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "✓ Swap configured successfully:"
  free -h
fi

# 2. Update System Packages
echo "--> Updating APT packages..."
sudo apt-get update -y
sudo apt-get install -y curl wget git unzip ufw nginx postgresql postgresql-contrib

# 3. Install Node.js 20.x LTS & PM2
if ! command -v node &> /dev/null; then
  echo "--> Installing Node.js 20.x LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "--> Installing PM2 Process Manager..."
sudo npm install -g pm2

# 4. Configure PostgreSQL
echo "--> Configuring PostgreSQL for VR Men's Wear..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'vr_admin') THEN CREATE ROLE vr_admin WITH LOGIN PASSWORD 'vr_secure_pass_2026'; END IF; END \$\$;"
sudo -u postgres createdb -O vr_admin vr_menswear 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vr_menswear TO vr_admin;"

# 5. Setup Project Directory
echo "--> Creating app directory /var/www/vrmenswear..."
sudo mkdir -p /var/www/vrmenswear
sudo chown -R ubuntu:ubuntu /var/www/vrmenswear

# 6. Configure Nginx Reverse Proxy
echo "--> Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/vrmenswear > /dev/null << 'EOF'
server {
    listen 80;
    server_name 13.235.16.44 vrmenswear.in www.vrmenswear.in;

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/vrmenswear /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 7. Configure Firewall
echo "--> Configuring UFW Firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

echo "=========================================="
echo "🎉 SERVER PROVISIONING COMPLETE!"
echo "Node: $(node -v) | NPM: $(npm -v) | PM2: $(pm2 -v) | Nginx: Active"
echo "PostgreSQL: vr_menswear database ready"
echo "Public IP: http://13.235.16.44"
echo "=========================================="
