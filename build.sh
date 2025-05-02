#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Build Tailwind CSS
cd theme/static_src
npm install
npm run build
cd ../../

# Collect static files (including built Tailwind CSS)
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate