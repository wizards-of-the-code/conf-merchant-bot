# Telegram Bot

### _Greatest bot of all, certainly_

## Documentation

[Miro concept board]("https://miro.com/app/board/uXjVMw8VRto=/")

## Installation

Create `.env` file in the root directory of rename `.env.example` file and add environment variables in it:

```sh
BOT_TOKEN=
MONGO_USERNAME=
MONGO_PASSWORD=
MONGO_DB_NAME=
```

- `BOT_TOKEN` can be obtained from the [@BotFather](https://t.me/botfather) bot in Telegram.
- `MONGO_USERNAME` and `MONGO_PASSWORD` will be shared in team's Rocket chat.
- `MONGO_DB_NAME` is a bot database name, `bot` for now.

Install the dependencies and devDependencies and start the project:

```sh
npm i
npm run build
npm start
```

For development environment use:

```sh
npm i
npm run dev
```

## Roadmap

- [x] Implement Airbnb ESLint
- [ ] Fill Miro board with Bot workflow concept
- [ ] Add Documentation & Conventions document

See the [open issues](https://github.com/AlshainS/project1/issues) for a full list of proposed features (and known issues).
