#!/bin/sh

# 데이터베이스 마이그레이션 실행
echo "Running database migrations..."
npx prisma migrate deploy

# 애플리케이션 시작
echo "Starting application..."
node dist/src/index.js
