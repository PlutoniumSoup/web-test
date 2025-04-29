# Исключаем Git
.git/
.gitignore

# Исключаем файлы Docker из контекста фронтенда
Dockerfile.dev
# Не копируем файлы других сервисов
../backend/
../docker-compose.yml
../.env*

# КРАЙНЕ ВАЖНО: Исключаем локальные зависимости Node.js
# Они будут установлены внутри контейнера
node_modules/

# Исключаем локальные артефакты сборки (не нужны для dev-образа)
dist/
build/
.npm/

# Исключаем логи Node.js
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Исключаем IDE/Editor файлы
.idea/
.vscode/
*.swp

# Исключаем OS файлы
.DS_Store
Thumbs.db