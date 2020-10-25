draft web music player app

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

