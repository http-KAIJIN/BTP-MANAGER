#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==============================${NC}"
echo -e "${CYAN}   BTP Manager - Quick Start  ${NC}"
echo -e "${CYAN}==============================${NC}"
echo ""

# Create .env if missing
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}Done.${NC}"
  echo ""
fi

# Source .env
set -a; source .env; set +a

# Mode selection
if [ "${1:-}" = "dev" ]; then
  echo -e "${YELLOW}Starting in development mode (without Docker)...${NC}"

  # Check prerequisites
  command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required.${NC}"; exit 1; }
  command -v psql >/dev/null 2>&1 || echo -e "${YELLOW}Warning: psql not found. Ensure PostgreSQL is running.${NC}"

  # Install dependencies
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install

  # Generate Prisma client
  echo -e "${YELLOW}Generating Prisma client...${NC}"
  npx --workspace backend prisma generate

  # Run migrations
  echo -e "${YELLOW}Running database migrations...${NC}"
  npx --workspace backend prisma migrate deploy
  echo -e "${GREEN}Migrations complete.${NC}"

  # Seed database
  echo -e "${YELLOW}Seeding database...${NC}"
  npx --workspace backend prisma db seed
  echo -e "${GREEN}Seed complete.${NC}"

  # Start both frontend and backend
  echo -e "${GREEN}Starting application...${NC}"
  echo -e "${CYAN}  Backend:  http://localhost:${BACKEND_PORT:-3101}${NC}"
  echo -e "${CYAN}  Frontend: http://localhost:${FRONTEND_PORT:-3100}${NC}"
  echo -e "${CYAN}  Login:    admin@btp-manager.local / Admin@123456${NC}"
  echo ""
  npm run dev
else
  echo -e "${YELLOW}Starting with Docker Compose...${NC}"

  # Check prerequisites
  command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required.${NC}"; exit 1; }

  # Build and start
  echo -e "${YELLOW}Building and starting containers...${NC}"
  docker compose up --build -d

  # Wait for backend
  echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
  BACKEND_PORT="${BACKEND_PORT:-3101}"
  for i in $(seq 1 30); do
    if curl -s "http://localhost:${BACKEND_PORT}/api/v1/" > /dev/null 2>&1; then
      echo -e "${GREEN}Backend is ready!${NC}"
      break
    fi
    sleep 2
  done

  echo -e "${GREEN}Application started!${NC}"
  echo -e "${CYAN}  Backend:  http://localhost:${BACKEND_PORT:-3101}${NC}"
  echo -e "${CYAN}  Frontend: http://localhost:${FRONTEND_PORT:-3100}${NC}"
  echo -e "${CYAN}  API Docs: http://localhost:${BACKEND_PORT:-3101}/api/docs${NC}"
  echo -e "${CYAN}  Login:    admin@btp-manager.local / Admin@123456${NC}"
  echo ""
  echo -e "${YELLOW}To stop: docker compose down${NC}"
fi
