#!/bin/sh

# backend/entrypoint.sh

# Ожидание доступности базы данных PostgreSQL
# Используем переменные окружения, переданные из docker-compose
echo "Waiting for postgres..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -q; do
  sleep 1
done
echo "PostgreSQL started"

# Применение миграций базы данных
echo "Applying database migrations..."
python manage.py migrate --noinput

# Сбор статики (если используется Django для статики админки и т.д.)
# echo "Collecting static files..."
# python manage.py collectstatic --noinput --clear

# Запуск основного процесса (команды, переданной после entrypoint в Dockerfile или docker-compose)
echo "Starting server..."
exec "$@"