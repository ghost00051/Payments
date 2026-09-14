# Payments — сервис управления рассрочками

<p align="center">
  <strong>Веб-приложение для планирования рассрочки, контроля платежей и хранения чеков</strong>
</p>

<p align="center">
  <a href="#-быстрый-старт">Быстрый старт</a> •
  <a href="#-возможности">Возможности</a> •
  <a href="#-архитектура">Архитектура</a> •
  <a href="#-api">API</a> •
  <a href="#-разработка">Разработка</a>
</p>

![Статус проекта](https://img.shields.io/badge/status-in%20development-orange)
![Frontend](https://img.shields.io/badge/frontend-React%2019-61dafb?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Express%205-000000?logo=express&logoColor=white)
![Database](https://img.shields.io/badge/database-PostgreSQL-4169e1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

> [!IMPORTANT]
> Репозиторий содержит два независимых Node.js-приложения: клиент в [`payments/`](./payments/) и API-сервер в [`server/`](./server/). У каждого приложения свой `package.json` и свои зависимости, поэтому `npm install` необходимо выполнить в обеих директориях.

## Содержание

<details>
<summary>Открыть содержание</summary>

- [О проекте](#-о-проекте)
- [Возможности](#-возможности)
- [Стек](#-стек)
- [Архитектура](#-архитектура)
- [Структура репозитория](#-структура-репозитория)
- [Быстрый старт](#-быстрый-старт)
  - [Предварительные требования](#предварительные-требования)
  - [Настройка PostgreSQL](#настройка-postgresql)
  - [Настройка переменных окружения](#настройка-переменных-окружения)
  - [Установка и запуск](#установка-и-запуск)
  - [Проверка работоспособности](#проверка-работоспособности)
- [Пользовательский сценарий](#-пользовательский-сценарий)
- [Маршруты клиентского приложения](#-маршруты-клиентского-приложения)
- [API](#-api)
  - [Аутентификация](#аутентификация)
  - [Пользователи](#пользователи)
  - [Рассрочки](#рассрочки)
  - [Платежи](#платежи)
  - [Файлы и чеки](#файлы-и-чеки)
  - [Восстановление пароля](#восстановление-пароля)
- [Модель данных](#-модель-данных)
- [Команды разработки](#-команды-разработки)
- [Сборка и развёртывание](#-сборка-и-развёртывание)
- [Тестирование](#-тестирование)
- [Troubleshooting](#-troubleshooting)
- [Безопасность и ограничения текущей версии](#-безопасность-и-ограничения-текущей-версии)
- [Чек-лист релиза](#-чек-лист-релиза)
- [Участие в разработке](#-участие-в-разработке)

</details>

## 📌 О проекте

**Payments** — сервис, в котором пользователь может:

1. создать аккаунт и войти в систему;
2. задать сумму и срок рассрочки;
3. автоматически получить календарь ежемесячных платежей;
4. загружать фотографии чеков;
5. отмечать платежи как оплаченные;
6. видеть просроченные и будущие платежи;
7. просматривать историю оплат и скачивать чеки;
8. редактировать профиль и восстанавливать пароль по email.

Проект рассчитан на связку **React SPA + Express API + PostgreSQL**. Авторизация построена на JWT-токене, который клиент сохраняет в `localStorage` и передаёт серверу в заголовке `Authorization`.

## ✨ Возможности

| Раздел | Что доступно |
| --- | --- |
| Регистрация | ФИО, email, телефон, пароль; проверка уникальности email и телефона |
| Вход | JWT-токен со сроком действия 24 часа |
| Рассрочка | Сумма, количество месяцев, дата начала, шаг округления платежа |
| План платежей | Автоматический расчёт дат и корректировка последнего платежа на разницу округления |
| Оплата | Загрузка фотографии чека и перевод платежа в статус `paid` |
| Статусы | `pending`, `paid`, `late`; рассрочка может быть `active` или `completed` |
| История | Список оплаченных платежей с датой, суммой и скачиванием чека |
| Профиль | Просмотр и редактирование ФИО, email и телефона |
| Восстановление пароля | Ссылка из email, срок действия токена — 1 час |
| Адаптивный интерфейс | Отдельные CSS-модули стилей для основных экранов |

## 🧰 Стек

### Клиент

- React `19.1.0`
- React Router DOM `7.6.3`
- Material UI и Emotion
- Framer Motion
- Create React App / `react-scripts` `5.0.1`
- Testing Library

### Сервер

- Node.js 18+
- Express `5.1.0`
- PostgreSQL через `pg`
- JWT через `jsonwebtoken`
- Хеширование паролей через `bcrypt`
- Multipart-загрузка файлов через `multer`
- CORS
- Nodemailer для восстановления пароля
- Nodemon для разработки

## 🏛 Архитектура

```mermaid
flowchart LR
    Browser["Браузер пользователя"] --> React["React SPA<br/>payments/"]
    React -->|"REST / JSON / multipart"| API["Express API<br/>server/index.js"]
    API --> Auth["JWT + bcrypt"]
    API --> DB[("PostgreSQL")]
    API --> Files["UPLOAD_DIR<br/>фотографии чеков"]
    API --> SMTP["SMTP<br/>восстановление пароля"]
```

### Поток авторизации

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant C as React
    participant A as Express API
    participant D as PostgreSQL

    U->>C: Email + пароль
    C->>A: POST /login
    A->>D: Найти пользователя
    A->>A: bcrypt.compare + JWT
    A-->>C: token
    C->>C: localStorage.setItem("token")
    C->>A: Запрос с Authorization: Bearer <token>
    A->>A: jwt.verify
    A-->>C: Защищённые данные
```

### Жизненный цикл платежа

```mermaid
stateDiagram-v2
    [*] --> pending: Создание рассрочки
    pending --> paid: Загрузка/подтверждение оплаты
    pending --> late: Дата платежа прошла
    late --> paid: Оплата просроченного платежа
    paid --> [*]
```

## 📁 Структура репозитория

```text
.
├── README.md
├── .gitignore
├── payments/                         # React-клиент
│   ├── public/
│   ├── src/
│   │   ├── component/
│   │   │   ├── LoanParameters/       # Создание рассрочки
│   │   │   ├── entrance/             # Вход
│   │   │   ├── forgotPassword/       # Запрос сброса пароля
│   │   │   ├── history/              # История оплат
│   │   │   ├── home/                 # Главный экран и платежи
│   │   │   ├── profile/              # Выход и экран профиля
│   │   │   ├── profileDescription/   # Данные профиля
│   │   │   └── resetPassword/        # Новый пароль
│   │   ├── css/                      # Стили экранов
│   │   ├── img/                      # Исходные изображения и SVG
│   │   ├── App.js                    # Регистрация
│   │   └── index.js                  # React Router
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
└── server/                           # Express API
    ├── index.js                      # Сервер, API и инициализация БД
    ├── routes/payments.js            # Дополнительный роутер платежей
    ├── uploads/                      # Загруженные чеки
    ├── package.json
    └── package-lock.json
```

## 🚀 Быстрый старт

### Предварительные требования

Установите:

- Node.js 18 или новее;
- npm 9 или новее;
- PostgreSQL 14+;
- SMTP-аккаунт, если нужна функция восстановления пароля.

Проверка версий:

```bash
node --version
npm --version
psql --version
```

### Настройка PostgreSQL

Создайте базу и пользователя любым удобным способом. Пример для `psql`:

```sql
CREATE USER payments_user WITH PASSWORD 'change-me';
CREATE DATABASE payments OWNER payments_user;
```

Таблицы `users`, `installments`, `payments`, `password_reset_tokens` и необходимые индексы сервер создаёт автоматически при запуске через `CREATE TABLE IF NOT EXISTS`.

> [!WARNING]
> Для production используйте отдельного пользователя БД с минимальными правами и надёжный пароль. Не добавляйте пароль в Git, README или Dockerfile.

### Настройка переменных окружения

Создайте файл `server/.env`:

```dotenv
# Express
PORT=30001

# PostgreSQL
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=payments
PGUSER=payments_user
PGPASSWORD=change-me

# JWT
JWT_SECRET=replace-with-a-long-random-secret

# Каталог для фотографий чеков
UPLOAD_DIR=./uploads

# Публичный URL клиента для ссылки восстановления пароля
FRONTEND_URL=http://localhost:3000
```

Сгенерировать секрет можно так:

```bash
openssl rand -hex 32
```

<details>
<summary>Минимальный шаблон .env для локальной разработки</summary>

```dotenv
PORT=30001
PGHOST=localhost
PGPORT=5432
PGDATABASE=payments
PGUSER=postgres
PGPASSWORD=postgres
JWT_SECRET=local-only-secret
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
```

</details>

> [!NOTE]
> Клиент сейчас использует API-адрес `https://split-fiction.ru` напрямую в компонентах. Поле `proxy` в [`payments/package.json`](./payments/package.json) указывает на `http://localhost:3000`, но для production-сборки URL API следует централизовать через переменную окружения React, например `REACT_APP_API_URL`.

### Установка и запуск

Откройте два терминала.

<details open>
<summary>Терминал 1 — API-сервер</summary>

```bash
cd server
npm ci
npm run dev
```

Для запуска без Nodemon:

```bash
npm start
```

API будет доступен по адресу `http://localhost:30001`, если `PORT` не переопределён.

</details>

<details open>
<summary>Терминал 2 — React-клиент</summary>

```bash
cd payments
npm ci
npm start
```

Клиент откроется по адресу `http://localhost:3000`.

</details>

### Проверка работоспособности

```bash
curl http://localhost:30001/
curl http://localhost:30001/health
```

Ожидаемый ответ `/health`:

```json
{
  "status": "OK",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 1.23
}
```

## 👤 Пользовательский сценарий

<details>
<summary>Сценарий от регистрации до первой оплаты</summary>

1. Откройте `/`.
2. Заполните ФИО, email, телефон и пароль.
3. После успешной регистрации клиент сохранит JWT в `localStorage`.
4. Перейдите на `/loanParameters`.
5. Укажите сумму кредита, число месяцев, дату начала и шаг округления.
6. Сервер создаст рассрочку и набор платежей.
7. На `/main` выберите платёж и загрузите фотографию чека.
8. После успешной обработки платёж получит статус `paid`.
9. На экране истории откройте `/payments/history` и скачайте чек.

</details>

## 🧭 Маршруты клиентского приложения

| URL | Компонент | Назначение |
| --- | --- | --- |
| `/` | `App` | Регистрация |
| `/entrance` | `Entrance` | Вход |
| `/loanParameters` | `LoanParameters` | Создание рассрочки |
| `/main` | `Main` | Главный экран, график и оплата |
| `/forgot` | `Forgot` | Запрос сброса пароля |
| `/reset-password?token=...` | `Reset` | Установка нового пароля |
| `/profile` | `Profile` | Выход/профиль |
| `/profile/description` | `ProfileDecription` | Просмотр и редактирование профиля |

## 🔌 API

Базовый URL локального API: `http://localhost:30001`.

### Аутентификация

Защищённые методы требуют заголовок:

```http
Authorization: Bearer <JWT_TOKEN>
```

Типовые ответы:

| Код | Значение |
| --- | --- |
| `200` | Успешное чтение или обновление |
| `201` | Ресурс создан |
| `400` | Некорректные или неполные данные |
| `401` | Токен отсутствует |
| `403` | Токен недействителен или истёк |
| `404` | Ресурс не найден |
| `500` | Ошибка сервера |

### Системные методы

| Метод | Путь | Auth | Назначение |
| --- | --- | :---: | --- |
| `GET` | `/` | Нет | Проверка, что сервер запущен |
| `GET` | `/health` | Нет | Health check и uptime |

### Пользователи

<details>
<summary>POST /register — регистрация</summary>

```bash
curl -X POST http://localhost:30001/register \
  -H 'Content-Type: application/json' \
  -d '{
    "full_name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+79990000000",
    "password": "strong-password"
  }'
```

</details>

<details>
<summary>POST /login — вход</summary>

```bash
curl -X POST http://localhost:30001/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=ivan@example.com&password=strong-password'
```

</details>

| Метод | Путь | Auth | Назначение |
| --- | --- | :---: | --- |
| `GET` | `/profile` | Да | Получить профиль текущего пользователя |
| `PUT` | `/profile` | Да | Обновить `full_name`, `email`, `phone` |

Пример обновления:

```bash
curl -X PUT http://localhost:30001/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Иван Петров","email":"ivan@example.com","phone":"+79991112233"}'
```

### Рассрочки

| Метод | Путь | Auth | Назначение |
| --- | --- | :---: | --- |
| `POST` | `/installments` | Да | Создать рассрочку и платежи |
| `GET` | `/installments/:user_id` | Нет* | Получить рассрочки пользователя |
| `GET` | `/installments/:id` | Нет* | Получить одну рассрочку |
| `GET` | `/payments/installment/:installment_id` | Да | Получить платежи рассрочки |

> [!WARNING]
> Методы `GET /installments/:user_id` и `GET /installments/:id` в текущем коде не защищены JWT. Перед production-развёртыванием добавьте авторизацию и проверку владельца ресурса.

Пример создания:

```bash
curl -X POST http://localhost:30001/installments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": 1,
    "total_amount": 120000,
    "payments_count": 12,
    "start_date": "2026-10-01",
    "end_date": "2027-09-01",
    "round_payments_to": 100
  }'
```

Сервер возвращает созданную рассрочку, массив платежей, признак округления и итоговую сумму графика.

### Платежи

| Метод | Путь | Auth | Content-Type | Назначение |
| --- | --- | :---: | --- | --- |
| `GET` | `/payments` | Нет | — | Список сумм и статусов платежей |
| `POST` | `/payments` | Да | `multipart/form-data` | Обработать ближайший ожидающий платеж |
| `PUT` | `/payments/:id/status` | Да | JSON | Изменить статус |
| `PUT` | `/payments/:id/photo` | Да | `multipart/form-data` | Прикрепить/заменить чек |
| `PUT` | `/installments/:id/paid-amount` | Да | JSON | Обновить оплачиваемую сумму |
| `POST` | `/extra-payments` | Да | `multipart/form-data` | Дополнительный платёж (экспериментальный) |
| `GET` | `/payments/history` | Да | — | История оплаченных платежей текущего пользователя |

Загрузка обычного платежа:

```bash
curl -X POST http://localhost:30001/payments \
  -H "Authorization: Bearer $TOKEN" \
  -F 'installment_id=1' \
  -F 'amount=10000' \
  -F 'photo=@./receipt.jpg'
```

Изменение статуса:

```bash
curl -X PUT http://localhost:30001/payments/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"paid"}'
```

Допустимые статусы платежа: `pending`, `paid`, `late`.

### Файлы и чеки

| Метод | Путь | Auth | Назначение |
| --- | --- | :---: | --- |
| `GET` | `/download/:filename` | Да | Скачать файл из `UPLOAD_DIR` |

Имя файла передаётся без пути:

```bash
curl -L http://localhost:30001/download/receipt.jpg \
  -H "Authorization: Bearer $TOKEN" \
  -o receipt-downloaded.jpg
```

### Восстановление пароля

| Метод | Путь | Auth | Тело |
| --- | --- | :---: | --- |
| `POST` | `/forgot-password` | Нет | `{ "email": "..." }` |
| `POST` | `/validate-reset-token` | Нет | `{ "token": "..." }` |
| `POST` | `/reset-password` | Нет | `{ "token": "...", "newPassword": "..." }` |

Токен восстановления хранится в PostgreSQL, действует 1 час и после использования помечается как `used`.

## 🗃 Модель данных

```mermaid
erDiagram
    USERS ||--o{ INSTALLMENTS : owns
    INSTALLMENTS ||--o{ PAYMENTS : contains
    PAYMENTS ||--o| PAYMENTS : links
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests

    USERS {
      int id PK
      varchar full_name
      varchar email UK
      varchar phone
      varchar password_hash
      timestamp created_at
    }
    INSTALLMENTS {
      int id PK
      int user_id FK
      numeric total_amount
      numeric paid_amount
      smallint payments_count
      date start_date
      date end_date
      varchar status
    }
    PAYMENTS {
      int id PK
      int installment_id FK
      numeric amount
      date due_date
      date paid_date
      varchar status
      smallint sequence
      varchar photo_path
      boolean is_fixed
      int linked_payment FK
    }
    PASSWORD_RESET_TOKENS {
      int id PK
      int user_id FK
      varchar token UK
      timestamptz expires_at
      boolean used
    }
```

При создании рассрочки сервер:

1. создаёт запись в `installments`;
2. делит `total_amount` на `payments_count`;
3. создаёт платежи с ежемесячными датами;
4. при округлении переносит остаток в последний платёж;
5. обновляет `paid_amount` и статус рассрочки после оплаты.

## 🛠 Команды разработки

### Клиент (`payments/`)

| Команда | Назначение |
| --- | --- |
| `npm start` | Запустить dev-сервер React |
| `npm run build` | Собрать production-версию в `build/` |
| `npm test` | Запустить тесты в watch-режиме |
| `npm run eject` | Извлечь конфигурацию CRA; необратимо |

### Сервер (`server/`)

| Команда | Назначение |
| --- | --- |
| `npm start` | Запустить API через Node.js |
| `npm run dev` | Запустить API через Nodemon |

## 📦 Сборка и развёртывание

### Сборка клиента

```bash
cd payments
npm ci
npm run build
```

Готовые статические файлы будут в `payments/build/`.

### Docker для клиента

В [`payments/Dockerfile`](./payments/Dockerfile) используется Node.js 18 Alpine:

```bash
cd payments
docker build -t payments-frontend .
docker run --rm -p 3000:3000 payments-frontend
```

> [!NOTE]
> Текущий Dockerfile запускает `npm start`, то есть development-сервер CRA. Для production лучше собирать `build/` и отдавать его через Nginx или другой статический веб-сервер.

### Production-чеклист

- [ ] Задать `NODE_ENV=production` на уровне окружения/оркестратора.
- [ ] Использовать отдельную production-БД.
- [ ] Установить сильный `JWT_SECRET`.
- [ ] Ограничить CORS только доменом клиента.
- [ ] Перенести SMTP-учётные данные в переменные окружения/секрет-хранилище.
- [ ] Настроить постоянный том для `UPLOAD_DIR`.
- [ ] Настроить HTTPS.
- [ ] Добавить reverse proxy с лимитами размера загружаемых файлов.
- [ ] Настроить резервное копирование PostgreSQL и каталога чеков.
- [ ] Добавить миграции вместо изменения схемы только при старте приложения.

## ✅ Тестирование

Текущая тестовая конфигурация находится в клиенте:

```bash
cd payments
npm test
```

Для одноразового запуска в CI:

```bash
npm test -- --watchAll=false
```

Production-сборка:

```bash
npm run build
```

Ручная smoke-проверка API:

```bash
curl -f http://localhost:30001/health
```

## 🧯 Troubleshooting

<details>
<summary><strong>Клиент не подключается к API</strong></summary>

- Проверьте, что сервер запущен на `PORT=30001`.
- Проверьте `curl http://localhost:30001/health`.
- Проверьте CORS в `server/index.js`.
- Учтите, что отдельные клиентские компоненты используют production URL `https://split-fiction.ru`, а не локальный API.

</details>

<details>
<summary><strong>Ошибка подключения к PostgreSQL</strong></summary>

- Проверьте значения `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.
- Убедитесь, что PostgreSQL запущен.
- Проверьте подключение:

```bash
psql "postgresql://payments_user:change-me@127.0.0.1:5432/payments"
```

</details>

<details>
<summary><strong>Ошибка при загрузке фотографии</strong></summary>

- Проверьте, что `UPLOAD_DIR` существует и доступен на запись.
- Отправляйте файл как поле `photo`.
- Для production вынесите uploads в постоянное хранилище.

</details>

<details>
<summary><strong>JWT возвращает 401 или 403</strong></summary>

- Используйте формат `Authorization: Bearer <token>`.
- Проверьте, что токен не истёк (срок — 24 часа).
- Проверьте, что `JWT_SECRET` одинаков для всех экземпляров API.

</details>

<details>
<summary><strong>Не приходит письмо сброса пароля</strong></summary>

- Проверьте SMTP-конфигурацию и логи Nodemailer.
- Проверьте `FRONTEND_URL`.
- Убедитесь, что токен не старше 1 часа.
- Не используйте hardcoded SMTP-секреты в production.

</details>

## 🔐 Безопасность и ограничения текущей версии

> [!CAUTION]
> Этот раздел описывает фактические места, которые необходимо проверить перед публичным production-запуском.

- Переменные БД, JWT и загрузок должны задаваться через `server/.env`; файл `.env` уже исключён из Git.
- Клиент хранит JWT в `localStorage`. Для более строгой модели защиты рассмотрите короткоживущие access-токены и HttpOnly refresh-cookie.
- В API есть публичные методы чтения `/installments/:user_id` и `/installments/:id`; их следует защитить и проверять владельца.
- Для `multer` рекомендуется добавить ограничения размера и MIME-типа файла.
- Для скачивания чеков необходимо дополнительно проверять, что файл принадлежит текущему пользователю.
- CORS содержит список production-доменов и локальных адресов; перед публикацией оставьте только необходимые origin.
- SMTP-конфигурацию нельзя хранить в исходном коде; используйте переменные окружения или secret manager.
- Для изменения статуса и суммы платежа полезно добавить строгую авторизацию на уровне владельца рассрочки.
- Схема БД создаётся при старте, но для командной и production-разработки лучше использовать версионируемые миграции.
- Следует добавить rate limit для `/login`, `/register` и `/forgot-password`.
- Не логируйте пароли, JWT, SMTP-пароли и содержимое заголовка `Authorization`.

## 📋 Чек-лист релиза

```text
□ npm ci в payments/ и server/
□ Проверен server/.env
□ PostgreSQL доступен
□ /health отвечает 200
□ Создание таблиц прошло без ошибок
□ npm test -- --watchAll=false
□ npm run build
□ Проверены регистрация и вход
□ Проверено создание рассрочки
□ Проверена загрузка и скачивание чека
□ Проверено восстановление пароля
□ CORS ограничен нужными доменами
□ Секреты отсутствуют в Git
□ Настроены backup БД и uploads
□ Настроены логи и мониторинг
```

## 🤝 Участие в разработке

1. Создайте ветку от актуального состояния репозитория.
2. Делайте небольшие атомарные изменения.
3. Не добавляйте `.env`, реальные чеки, пароли и токены.
4. Перед Pull Request запустите:

   ```bash
   cd payments && npm test -- --watchAll=false && npm run build
   ```

5. В описании PR укажите:
   - что изменилось;
   - как проверить;
   - какие переменные окружения нужны;
   - есть ли изменения схемы БД или API.

## 📄 Лицензия

В [`server/package.json`](./server/package.json) указана лицензия `ISC`. Перед публичным распространением проекта проверьте, соответствует ли она требованиям владельца продукта и зависимостей.

---

<p align="center">
  <sub>Документация поддерживается вместе с кодом. Если команда, endpoint или переменная окружения изменились — обновите этот README в том же PR.</sub>
</p>
