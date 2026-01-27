# NBA Game Predictions Tracker 🏀

A full-stack web application that allows users to predict NBA game outcomes and track their prediction accuracy over time.

## Problem Description

### The Challenge
Sports fans love making predictions about game outcomes, but there's no simple, dedicated platform to:
- Track personal prediction accuracy over time
- Compare performance against other predictors
- Analyze which teams/matchups they predict well vs. poorly

### The Solution
NBA Game Predictions Tracker provides:
- **Game Browsing**: View upcoming NBA games with team matchups
- **Prediction Making**: Submit predictions for game winners and point spreads
- **Accuracy Tracking**: See your historical prediction accuracy with detailed breakdowns
- **Leaderboards**: Compare your performance against other users
- **Analytics Dashboard**: Visualize prediction patterns and identify strengths/weaknesses

### Target Users
- NBA fans who enjoy making game predictions
- Fantasy sports enthusiasts who want to track their "gut feel" accuracy
- Sports analytics hobbyists interested in their own prediction patterns

## AI-Assisted Development

### Tools Used
This project was built using AI-assisted development with:

1. **Claude (Anthropic)** - Primary coding assistant
   - Generated initial project structure and boilerplate
   - Wrote API specifications based on requirements
   - Implemented frontend React components
   - Created backend FastAPI endpoints
   - Wrote comprehensive test suites

2. **Workflow**
   - Started with problem definition and user stories
   - Generated OpenAPI specification first (API-first design)
   - Built frontend against the API contract
   - Implemented backend to fulfill the contract
   - Added tests iteratively

3. **MCP Integration**
   - Used MCP file system tools for project scaffolding
   - Leveraged MCP for reading documentation and best practices
   - Applied MCP-based workflows for code generation and iteration

### AGENTS.md Guidance
See `AGENTS.md` for detailed instructions on how AI agents should interact with this codebase.

## Technologies & System Architecture

### Frontend
- **React 18** with TypeScript - Component-based UI framework
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Server state management and caching
- **React Router** - Client-side routing
- **Vitest** - Unit testing framework

### Backend
- **FastAPI** - Modern Python web framework with automatic OpenAPI docs
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and serialization
- **Alembic** - Database migrations
- **Pytest** - Testing framework

### Database
- **SQLite** - Development and testing
- **PostgreSQL** - Production deployment
- Automatic environment-based switching via configuration

### Infrastructure
- **Docker** - Containerization for all services
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **Railway/Render** - Cloud deployment platform

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React SPA     │────▶│   FastAPI       │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
   Port 5173              Port 8000
   (dev) / 80             (API)
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/nba-predictions.git
cd nba-predictions

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Run All Tests
```bash
# Using Docker
docker-compose run --rm backend pytest
docker-compose run --rm frontend npm test

# Local
cd backend && pytest -v
cd frontend && npm test
```

### Test Categories
- **Unit Tests**: Individual component/function tests
- **Integration Tests**: API endpoint tests with database
- **E2E Tests**: Full user flow tests

## API Documentation

- **OpenAPI Spec**: See `openapi.yaml` in the project root
- **Interactive Docs**: Available at `/docs` when backend is running
- **ReDoc**: Available at `/redoc` when backend is running

## Deployment

### Cloud Deployment (Railway)
1. Fork this repository
2. Connect to Railway
3. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SECRET_KEY` - JWT secret for authentication
4. Deploy automatically on push to main

### Manual Deployment
See `DEPLOYMENT.md` for detailed deployment instructions.

## Project Structure

```
nba-predictions/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level components
│   │   ├── api/           # API client (centralized)
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript type definitions
│   ├── tests/             # Frontend tests
│   └── Dockerfile
├── backend/               # FastAPI backend application
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── db/           # Database configuration
│   ├── tests/            # Backend tests
│   │   ├── unit/         # Unit tests
│   │   └── integration/  # Integration tests
│   └── Dockerfile
├── openapi.yaml          # API contract specification
├── docker-compose.yml    # Container orchestration
├── .github/workflows/    # CI/CD pipeline
├── AGENTS.md            # AI agent guidance
└── README.md            # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
