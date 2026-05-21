# Pair — Font Pairing Tool

Mobile-first веб-приложение для подбора шрифтовых пар. Загружаешь скриншот → Mistral Pixtral AI распознаёт шрифт → получаешь 6 курируемых пар из Google Fonts.

**Стек:** статичный HTML + Netlify Function (прокси к Mistral API)
**Стоимость:** 0 ₽ — всё на бесплатных тарифах.

## Деплой (≈6 минут)

### 1. Получи бесплатный Mistral API key (1 мин)

1. Зайди на [console.mistral.ai](https://console.mistral.ai)
2. Зарегистрируйся (email + пароль, без карты)
3. Подтверди email
4. Слева в меню — **API Keys** → **Create new key**
5. Выбери план **Experiment** (он бесплатный)
6. Скопируй ключ — сохрани в надёжном месте, его больше не покажут

Лимиты: 2 запроса/мин, 1 млрд токенов/месяц. Карта не нужна.

> Mistral — французская компания, доступна в большинстве регионов мира, включая те, где Google и OpenAI заблокированы.

### 2. Залей файлы в GitHub (2 мин)

1. [github.com](https://github.com) → **+** → **New repository**
2. Назови `pair`, поставь **Public** → **Create**
3. На странице репо: **Add file → Upload files**
4. Перетащи распакованную папку проекта (`index.html`, `netlify.toml`, папку `netlify/`)
   — GitHub сам сохранит структуру
5. Внизу **Commit changes**

### 3. Подключи к Netlify (2 мин)

1. [netlify.com](https://netlify.com) → **Sign up** → войди через GitHub
2. **Add new site → Import an existing project**
3. **Deploy with GitHub** → выбери репо `pair`
4. Настройки оставь по умолчанию → **Deploy**
5. Подожди ~30 сек, пока Netlify соберёт сайт

### 4. Добавь Mistral API key в Netlify (1 мин)

1. На странице сайта в Netlify: **Site configuration → Environment variables**
2. **Add a variable**
3. **Key:** `MISTRAL_API_KEY`
4. **Value:** твой ключ из шага 1
5. **Create variable**

### 5. Пересобери сайт (30 сек)

1. **Deploys** (вкладка вверху) → **Trigger deploy → Deploy site**
2. Подожди ~30 сек

Готово. Сверху страницы ссылка вида `https://random-name-12345.netlify.app` — рабочая, делится с кем угодно.

Можно сменить имя: **Site configuration → Site details → Change site name**.

## Структура проекта

```
pair/
├── index.html              ← фронтенд
├── netlify.toml            ← конфиг Netlify
└── netlify/
    └── functions/
        └── analyse.js      ← прокси к Mistral API
```

## Как это работает

1. Юзер загружает картинку → JS уменьшает её до 1024px для скорости
2. Base64 уходит в `/.netlify/functions/analyse`
3. Функция (на сервере Netlify) подкладывает `MISTRAL_API_KEY` и шлёт запрос к Pixtral 12B
4. Pixtral распознаёт шрифт + предлагает 6 пар → возвращает JSON
5. Фронт показывает 3 случайные пары с живым превью
6. «Другие пары» — шафлит из тех же 6

API-ключ никогда не светится в браузере — только на сервере Netlify.

## Лимиты

- **Mistral free tier:** 2 запроса/мин, 1 млрд токенов/мес. Если кто-то слишком быстро жмёт «распознать» — увидит «Подожди 30 секунд».
- **Netlify free tier:** 125k вызовов функций/мес, 100 ГБ трафика — для такого проекта неисчерпаемо.

## Альтернативные AI-провайдеры

Если Mistral вдруг не подойдёт, в коде функции легко поменять провайдера. В `analyse.js` нужно поменять:
- URL запроса
- Заголовки авторизации
- Формат тела (большинство OpenAI-совместимы)
- Формат разбора ответа

Бесплатные альтернативы с vision-моделями и без карты:
- **Cloudflare Workers AI** — Llama 3.2 Vision, 10k запросов/день, доступен глобально
- **Hugging Face Inference API** — много vision-моделей
- **OpenRouter** — агрегатор, есть бесплатные vision-модели
- **Together AI** — $1 free credit (хватит на сотни запросов)

## Изменить дизайн / тексты

Всё в одном файле `index.html`. Поправил → закоммитил в GitHub → Netlify автоматически передеплоит за ~30 сек.

## Изменить промпт к AI

В `netlify/functions/analyse.js` найди переменную `prompt` — там вся инструкция для модели. Например, можно попросить:
- больше/меньше пар
- разные категории шрифтов
- объяснения на английском, не на русском
- использование конкретных весов

После правки → commit в GitHub → автодеплой.
