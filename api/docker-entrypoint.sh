#!/bin/sh
# ===================================
# docker-entrypoint.sh
# ===================================

set -e

echo "🚀 Starting application entrypoint..."

# Function to wait for database to be ready
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  
  # Extract database connection details from DATABASE_URL if available
  # Format: postgresql://user:password@host:port/database
  
  if [ -n "$DATABASE_URL" ]; then
    # Simple wait - you can make this more sophisticated
    sleep 5
    echo "✅ Database should be ready"
  else
    echo "⚠️  DATABASE_URL not set, skipping database wait"
  fi
}

# Wait for database to be ready
wait_for_db

# Run migrations only if MIGRATE=true or RUN_MIGRATIONS=true
if [ "$MIGRATE" = "true" ] || [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🔄 Running database migrations..."
  npm run migrate
  echo "✅ Migrations completed"
else
  echo "⏭️  Skipping migrations (set MIGRATE=true to run)"
fi

# Run seeds only if SEED=true or RUN_SEEDS=true
if [ "$SEED" = "true" ] || [ "$RUN_SEEDS" = "true" ]; then
  echo "🌱 Running database seeds..."
  npm run seed
  echo "✅ Seeds completed"
else
  echo "⏭️  Skipping seeds (set SEED=true to run)"
fi

# Check if we should run in development mode
if [ "$NODE_ENV" = "development" ]; then
  echo "🔧 Starting in DEVELOPMENT mode..."
  exec npm run dev
else
  echo "🚀 Starting in PRODUCTION mode..."
  exec npm run start
fi