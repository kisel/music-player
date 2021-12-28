simple self-hosted web music player app

### Simple self-hosted music player

- typescript, sqlite, sequelize


### Deploy

check [docker-compose.yml](docker-compose.yml)
Server will be running on port 5555.


### Music library
To be mounted as volumes

- /data/media

### Ingress

- `/` - served by player
- `/media/` - content of `/data/media` served by external nginx(or other http server)

### Auth, HTTPS
- reverse proxy server should take care of this


### Databases

#### SQLITE

DATABASE_URL=sqlite:/db/database.sqlite

#### Postgres

DATABASE_URL=postgres://user:pass@example.com:5432/dbname

