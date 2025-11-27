# TODO App

A simple TODO application built with Django as part of the AI-Assisted Development module in the AI Development Tools Zoomcamp.

## Features

- Create, edit, and delete TODOs
- Assign due dates
- Mark TODOs as resolved/completed

## Setup

1. Install uv (if not already installed):
```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
   uv add django
```

3. Run migrations:
```bash
   uv run python manage.py migrate
```

4. Start the server:
```bash
   uv run python manage.py runserver
```

5. Open http://127.0.0.1:8000/ in your browser

## Running Tests
```bash
uv run python manage.py test
```

## Built With

- Python
- Django
- uv (package manager)
- AI-assisted development (Claude)