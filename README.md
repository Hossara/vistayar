# Vistayar
A node base telegram bot for [vistateam academy](https://t.me/@vistateam_admin).

![Version](https://img.shields.io/badge/Version-1.0.0-green)
![Contributor](https://img.shields.io/badge/Contributor-Hossein%20Araghi-blue)

`Tech stack:` Typescript, Telegraf.js, Nodemon.js, Google firebase admin

<!-- TOC -->
* [Vistayar](#vistayar)
    * [Develop tracking](#develop-tracking)
    * [Run and test](#run-and-test)
    * [Production](#production)
    * [Environment](#environment)
    * [Contributors](#contributors)
    * [Donate me](#donate-me)
<!-- TOC -->

### Develop tracking
- [x] MVP 
- [x] Release v1
- [ ] Test
- [ ] Refactor using Nest.js
- [ ] Refactor MVP Technical debt
- [ ] Use and implement MongoDB as main database
- [ ] Test
- [ ] Implement v2 backlog
- [ ] Release v2
- [ ] Test

### Run and test
```bash
# To start redis server 
docker compose up -d

# To start app
pnpm start
```

### Production
1. Build and push `Dockerfile` into your repository
2. Use Docker compose to run the bot
```yaml
services:
  vista_redis_stack:
    container_name: vista_redis_stack
    image: redis/redis-stack:latest
    environment:
      REDIS_ARGS: "--requirepass redispass"
    ports:
      - "your_own_port:8001"
    volumes:
      - "./redis_data:/data"

  vista_bot:
    container_name: vista_bot
    image: yourusername/vistayar:latest
    restart: on-failure
    depends_on:
      - vista_redis_stack
    volumes:
      - "./db_info.json:/app/db_info.json"
```

`! Remember to place your own db_info.json file near docker-compose.yaml`
### Environment

| ENV                     | Usage                                                                                                            | Required |
|-------------------------|------------------------------------------------------------------------------------------------------------------|:--------:|
| IS_DEV                  | To force the bot to use a proxy to connect to the server                                                         |  FALSE   |
| PROXY                   | Proxy url. For example: socks5://127.0.0.1:20170                                                                 |  FALSE   |
| BOT_TOKEN               | Telegram bot token                                                                                               |   TRUE   |
| REDIS_SERVER            | Redis server url. For example: redis://localhost:6380                                                            |   TRUE   |
| FIREBASE_ADMIN_DATABASE | [Google firebase admin database token](https://console.cloud.google.com/iam-admin/serviceaccounts/project?hl=en) |   TRUE   |

### Contributors
- Hossein Araghi
    - [GitHub](https://github.com/hossara)
    - [LinkedIn](https://linkedin.com/in/hossara)
    - [Email](mailto:hossara.dev@gmail.com)
    - [Instagram](https://instagram.com/hossara.dev)

### Donate me

<a href="https://coffeebede.ir/hossara">
  <img alt="donate me!" src="https://img.shields.io/badge/buy me a coffee-darkgreen.svg?&style=for-the-badge&logo=buymeacoffee&logoColor=white" height=30>
</a>
