# AGENTS.md - AI Agent Guidance

This document provides guidance for AI coding assistants working with this codebase.

## Project Overview

NBA Game Predictions Tracker is a full-stack application with:
- React/TypeScript frontend
- FastAPI/Python backend
- PostgreSQL database (SQLite for development)

## Code Style Guidelines

### Backend (Python)
- Use type hints for all function parameters and return values
- Follow PEP 8 style guidelines
- Use async/await for database operations
- Document functions with docstrings
- Use Pydantic for all API request/response models

### Frontend (TypeScript/React)
- Use functional components with hooks
- Define interfaces for all props and API responses
- Use React Query for server state
- Keep components small and focused
- Centralize API calls in `src/api/` directory

## Architecture Decisions

### API-First Design
The `openapi.yaml` file is the source of truth for the API contract. When making changes:
1. Update `openapi.yaml` first
2. Update backend to match the spec
3. Update frontend API client

### Database Strategy
- Use SQLAlchemy ORM for all database operations
- Support both SQLite (dev) and PostgreSQL (prod)
- Use Alembic for migrations
- Never write raw SQL in application code

### Testing Strategy
- Unit tests: Test individual functions/components in isolation
- Integration tests: Test API endpoints with real database
- Keep test files adjacent to source files or in dedicated `tests/` directories

## Common Tasks

### Adding a New API Endpoint
1. Define the endpoint in `openapi.yaml`
2. Create Pydantic schemas in `backend/app/schemas/`
3. Add SQLAlchemy model if needed in `backend/app/models/`
4. Implement route handler in `backend/app/api/`
5. Add service logic in `backend/app/services/`
6. Write integration tests
7. Update frontend API client

### Adding a New Frontend Page
1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Create any needed API functions in `frontend/src/api/`
4. Add any reusable components to `frontend/src/components/`
5. Write component tests

## Environment Variables

### Backend
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT signing key
- `ENVIRONMENT`: development/production

### Frontend
- `VITE_API_URL`: Backend API base URL

## MCP Tools Usage

When using MCP tools with this project:
- Use file read tools to understand existing code before making changes
- Use search tools to find related code across the codebase
- Create files in appropriate directories following the project structure
- Run tests after making changes to verify functionality

## Deployment

The application is containerized and deployed via CI/CD:
1. Push to main triggers GitHub Actions
2. Tests run automatically
3. If tests pass, deploy to Railway/Render
4. Database migrations run automatically on deploy
