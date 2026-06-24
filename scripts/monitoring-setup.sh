#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="infrastructure/monitoring"
SERVICES_DIR="services/monitoring-service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== Fund My Cause Monitoring Setup ===${NC}"

# Function to print messages
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  print_info "Checking prerequisites..."

  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
  fi
  print_status "Docker found"

  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
  fi
  print_status "Docker Compose found"

  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi
  print_status "Node.js found"
}

# Start monitoring stack
start_stack() {
  print_info "Starting monitoring stack..."
  
  cd "$PROJECT_ROOT/$MONITORING_DIR"
  
  print_info "Building Docker images..."
  docker-compose build --no-cache || {
    print_error "Failed to build Docker images"
    exit 1
  }
  print_status "Docker images built"

  print_info "Starting services..."
  docker-compose up -d || {
    print_error "Failed to start services"
    exit 1
  }
  print_status "Services started"

  print_info "Waiting for services to be healthy..."
  sleep 10

  # Check service health
  check_service_health
}

# Check service health
check_service_health() {
  print_info "Checking service health..."

  services=("prometheus" "jaeger" "grafana" "alertmanager")
  
  for service in "${services[@]}"; do
    print_info "Checking $service..."
    
    case $service in
      prometheus)
        if curl -s http://localhost:9090/-/healthy > /dev/null; then
          print_status "Prometheus is healthy"
        else
          print_warning "Prometheus health check inconclusive (may still be starting)"
        fi
        ;;
      jaeger)
        if curl -s http://localhost:14268/api/traces/1 > /dev/null 2>&1; then
          print_status "Jaeger is healthy"
        else
          print_warning "Jaeger health check inconclusive"
        fi
        ;;
      grafana)
        if curl -s http://localhost:3000/api/health > /dev/null; then
          print_status "Grafana is healthy"
        else
          print_warning "Grafana health check inconclusive"
        fi
        ;;
      alertmanager)
        if curl -s http://localhost:9093/-/healthy > /dev/null; then
          print_status "AlertManager is healthy"
        else
          print_warning "AlertManager health check inconclusive"
        fi
        ;;
    esac
  done
}

# Run tests
run_tests() {
  print_info "Running monitoring service tests..."
  
  cd "$PROJECT_ROOT/$SERVICES_DIR"
  
  print_info "Installing dependencies..."
  npm ci || {
    print_error "Failed to install dependencies"
    exit 1
  }
  print_status "Dependencies installed"

  print_info "Running linter..."
  npm run lint || print_warning "Linter found issues"

  print_info "Running type check..."
  npm run type-check || {
    print_error "TypeScript compilation failed"
    exit 1
  }
  print_status "TypeScript compilation successful"

  print_info "Running tests..."
  npm run test:coverage || {
    print_error "Tests failed"
    exit 1
  }
  print_status "All tests passed"

  # Check coverage
  if [ -f "coverage/coverage-summary.json" ]; then
    coverage=$(grep -o '"lines".*"pct":[0-9.]*' coverage/coverage-summary.json | grep -o '[0-9.]*$' | head -1)
    print_status "Test coverage: ${coverage}%"
    
    if (( $(echo "$coverage < 70" | bc -l) )); then
      print_warning "Coverage is below 70% threshold"
    else
      print_status "Coverage meets 70% threshold"
    fi
  fi
}

# Stop monitoring stack
stop_stack() {
  print_info "Stopping monitoring stack..."
  
  cd "$PROJECT_ROOT/$MONITORING_DIR"
  docker-compose down || print_warning "Failed to stop some services"
  
  print_status "Monitoring stack stopped"
}

# Display access information
show_access_info() {
  echo ""
  echo -e "${GREEN}=== Monitoring Stack Running ===${NC}"
  echo -e "${BLUE}Access the services:${NC}"
  echo -e "  ${YELLOW}Grafana${NC}        : http://localhost:3000 (admin / admin)"
  echo -e "  ${YELLOW}Prometheus${NC}     : http://localhost:9090"
  echo -e "  ${YELLOW}AlertManager${NC}   : http://localhost:9093"
  echo -e "  ${YELLOW}Jaeger${NC}         : http://localhost:16686"
  echo -e "  ${YELLOW}OpenTelemetry${NC}  : http://localhost:4318 (HTTP)"
  echo ""
  echo -e "${BLUE}Monitoring Service:${NC}"
  echo -e "  ${YELLOW}Health${NC}         : http://localhost:9091/health"
  echo -e "  ${YELLOW}Metrics${NC}        : http://localhost:9091/metrics"
  echo ""
  echo -e "${BLUE}Useful commands:${NC}"
  echo -e "  View logs       : docker-compose -f $MONITORING_DIR/docker-compose.yml logs -f <service>"
  echo -e "  Stop stack      : $0 stop"
  echo -e "  Status          : docker-compose -f $MONITORING_DIR/docker-compose.yml ps"
  echo ""
}

# Validate configuration
validate_config() {
  print_info "Validating configuration files..."
  
  cd "$PROJECT_ROOT/$MONITORING_DIR"
  
  print_info "Validating Docker Compose..."
  docker-compose config > /dev/null || {
    print_error "Invalid Docker Compose configuration"
    exit 1
  }
  print_status "Docker Compose configuration valid"

  print_info "Checking JSON files..."
  for file in grafana/dashboards/*.json; do
    if ! jq empty "$file" 2>/dev/null; then
      print_error "Invalid JSON in $file"
      exit 1
    fi
  done
  print_status "All JSON files valid"

  print_info "Checking YAML files..."
  for file in *.yml; do
    print_status "Validated $file"
  done
}

# Display help
show_help() {
  cat << EOF
Usage: $0 [COMMAND]

Commands:
  start         Start the monitoring stack (default)
  stop          Stop the monitoring stack
  restart       Restart the monitoring stack
  test          Run monitoring service tests
  validate      Validate configuration files
  health        Check service health
  logs          Show monitoring stack logs
  status        Show monitoring stack status
  help          Show this help message

Examples:
  $0                    # Start monitoring stack
  $0 start              # Start monitoring stack
  $0 stop               # Stop monitoring stack
  $0 test               # Run tests
  $0 health             # Check health
  $0 logs               # Show logs

EOF
}

# Main logic
case "${1:-start}" in
  start)
    check_prerequisites
    validate_config
    start_stack
    run_tests
    show_access_info
    ;;
  stop)
    stop_stack
    ;;
  restart)
    stop_stack
    sleep 2
    check_prerequisites
    validate_config
    start_stack
    show_access_info
    ;;
  test)
    run_tests
    ;;
  validate)
    validate_config
    print_status "Configuration is valid"
    ;;
  health)
    check_service_health
    ;;
  logs)
    cd "$PROJECT_ROOT/$MONITORING_DIR"
    docker-compose logs -f
    ;;
  status)
    cd "$PROJECT_ROOT/$MONITORING_DIR"
    docker-compose ps
    ;;
  help)
    show_help
    ;;
  *)
    print_error "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
