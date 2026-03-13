#!/bin/bash

# FinSathi AI - Market Data Pipeline Deployment Script
# This script sets up and deploys the market data pipeline

set -e  # Exit on any error

echo "🚀 Starting FinSathi AI Market Data Pipeline Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Copy market pipeline package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cp package-market-pipeline.json package.json
        print_status "Created package.json from market pipeline configuration"
    fi
    
    # Install dependencies
    npm install
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not found in environment"
        print_status "Please set DATABASE_URL in your environment or .env file"
        
        # Create .env file if it doesn't exist
        if [ ! -f ".env" ]; then
            cp .env.market-pipeline .env
            print_status "Created .env file from template. Please update DATABASE_URL"
        fi
    fi
    
    # Generate Prisma client
    npx prisma generate
    
    # Push schema to database
    npx prisma db push
    
    print_success "Database setup completed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p data
    mkdir -p backups
    
    print_success "Directories created"
}

# Setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    # Create logrotate configuration
    cat > /tmp/finsathi-market-pipeline << 'EOF'
/path/to/finsathi/server/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        kill -USR1 $(cat /path/to/finsathi/server/pipeline.pid 2>/dev/null || echo 0) 2>/dev/null || true
    endscript
}
EOF
    
    print_status "Log rotation configuration created at /tmp/finsathi-market-pipeline"
    print_warning "Please move this file to /etc/logrotate.d/ and update paths as needed"
}

# Create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/finsathi-market-pipeline.service"
    
    if [ "$EUID" -eq 0 ]; then
        # Running as root, create service directly
        cat > "$SERVICE_FILE" << EOF
[Unit]
Description=FinSathi AI Market Data Pipeline
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PATH=$(pwd)/node_modules/.bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/node src/services/marketDataPipeline.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=finsathi-market-pipeline

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$(pwd)/logs $(pwd)/data

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable finsathi-market-pipeline
        print_success "Systemd service created and enabled"
    else
        # Not running as root, create file for manual installation
        cat > finsathi-market-pipeline.service << EOF
[Unit]
Description=FinSathi AI Market Data Pipeline
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PATH=$(pwd)/node_modules/.bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/node src/services/marketDataPipeline.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=finsathi-market-pipeline

[Install]
WantedBy=multi-user.target
EOF
        
        print_warning "Systemd service file created. To install:"
        print_warning "  sudo cp finsathi-market-pipeline.service /etc/systemd/system/"
        print_warning "  sudo systemctl daemon-reload"
        print_warning "  sudo systemctl enable finsathi-market-pipeline"
    fi
}

# Test pipeline
test_pipeline() {
    print_status "Testing pipeline..."
    
    # Run pipeline manually
    timeout 60s node -e "
        const pipeline = require('./src/services/marketDataPipeline.js');
        const p = new pipeline();
        p.initialize().then(() => {
            return p.runManually();
        }).then(() => {
            console.log('✅ Pipeline test completed successfully');
            process.exit(0);
        }).catch((error) => {
            console.error('❌ Pipeline test failed:', error.message);
            process.exit(1);
        });
    " || {
        print_error "Pipeline test failed"
        exit 1
    }
    
    print_success "Pipeline test passed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create health check script
    cat > health-check.sh << 'EOF'
#!/bin/bash
# Health check script for market data pipeline

PIPELINE_PID=$(pgrep -f "marketDataPipeline.js")

if [ -z "$PIPELINE_PID" ]; then
    echo "❌ Pipeline is not running"
    exit 1
else
    echo "✅ Pipeline is running (PID: $PIPELINE_PID)"
fi

# Check if recent data exists
RECENT_DATA=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.marketSnapshot.findFirst({
        orderBy: { date: 'desc' }
    }).then(result => {
        if (result) {
            console.log('✅ Recent data found:', result.date);
        } else {
            console.log('❌ No recent data found');
        }
        prisma.$disconnect();
    }).catch(() => {
        console.log('❌ Database connection failed');
    });
" 2>/dev/null)

echo "$RECENT_DATA"
EOF
    
    chmod +x health-check.sh
    print_success "Health check script created"
}

# Main deployment function
deploy() {
    print_status "Starting deployment..."
    
    check_prerequisites
    install_dependencies
    setup_database
    create_directories
    setup_log_rotation
    create_systemd_service
    test_pipeline
    setup_monitoring
    
    print_success "🎉 Deployment completed successfully!"
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Update DATABASE_URL in your .env file"
    echo "2. Configure API keys if needed"
    echo "3. Start the service: sudo systemctl start finsathi-market-pipeline"
    echo "4. Check status: sudo systemctl status finsathi-market-pipeline"
    echo "5. View logs: sudo journalctl -u finsathi-market-pipeline -f"
    echo ""
    echo "🔧 Useful commands:"
    echo "  npm run pipeline:run    - Run pipeline manually"
    echo "  npm run pipeline:status  - Check pipeline status"
    echo "  npm run pipeline:cleanup - Clean old data"
    echo "  ./health-check.sh       - Health check"
    echo ""
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "test")
        test_pipeline
        ;;
    "setup-db")
        setup_database
        ;;
    "create-service")
        create_systemd_service
        ;;
    "health")
        ./health-check.sh
        ;;
    *)
        echo "Usage: $0 [deploy|test|setup-db|create-service|health]"
        echo "  deploy        - Full deployment (default)"
        echo "  test          - Test pipeline only"
        echo "  setup-db      - Setup database only"
        echo "  create-service - Create systemd service only"
        echo "  health        - Run health check"
        exit 1
        ;;
esac
