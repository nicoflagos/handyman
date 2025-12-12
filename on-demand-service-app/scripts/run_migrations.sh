#!/usr/bin/env sh
# Helper script to run compiled migrations (used by CI or containers)
if [ -z "$MONGO_URI" ]; then
  echo "MONGO_URI is not set, aborting"
  exit 1
fi

echo "Running migrations..."
node ./dist/scripts/migrate.js
RET=$?
if [ $RET -ne 0 ]; then
  echo "Migrations failed with exit code $RET"
  exit $RET
fi
echo "Migrations completed"
