#!/bin/sh
set -e

mkdir -p /app/data

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding initial data (skips if already present)..."
npx tsx prisma/seed.ts

exec "$@"
