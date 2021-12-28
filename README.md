simple self-hosted web music player app

### Simple self-hosted music player

- typescript, sqlite, sequelize


### Deploy

check [docker-compose.yml](docker-compose.yml)
Server will be running on port `process.env.PORT` or 5555.


### Music library
To be mounted as volumes

- /data/media

### Ingress

- `/` - served by player
- `/media/` - content of `/data/media` served by embedded express server or external server

### Auth, HTTPS
- reverse proxy server should take care of this


### Databases

#### SQLITE

DATABASE_URL=sqlite:/db/database.sqlite

#### Postgres

DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:5432/$DBNAME"


### Docker run

```
docker build -p 5555:5555 -e DATABASE_URL=$DATABASE_URL -v /data/media/music:/data/media/music music-player
```

