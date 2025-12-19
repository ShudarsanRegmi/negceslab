## Create admin user inside the container

```bash
podman exec -it backend node makeAdmin.js
```

## Create podman secret

```bash
echo "secret" | podman secret create mongo-root-password -
podman secret ls
```

## Export the databse secret before building the container

```bash
export MONGO_INITDB_ROOT_PASSWORD=secret
```

## Delete a volume
```bash
podman volume rm negceslab_mongo_data 2>/dev/null || true
```

## Check db auth
```bash
podman exec -it mongodb mongosh --username mongoadmin --password pass --authenticationDatabase admin
```

## Create a cronttab that runs every day at 2 AM

```bash
0 2 * * * /bin/bash ~/negces/negceslab/backup.sh >> ~/mongo-backups/backup.log 2>&1
```
---

## Commands to generate systemd files using Podman:

### 1. First, start your containers normally:
```bash
make up-mongo
make up-backend
```

### 2. Generate systemd files from running containers:
```bash
# Generate MongoDB service file
podman generate systemd --new --files --name mongodb

# Generate Backend service file  
podman generate systemd --new --files --name backend
```

### 3. Stop the containers (systemd will manage them now):
```bash
make down-backend
make down-mongo
```

### 4. Move the generated files to systemd directory:
```bash
mkdir -p ~/.config/systemd/user
mv container-*.service ~/.config/systemd/user/
```

### 5. Enable and start the services:
```bash
systemctl --user daemon-reload
systemctl --user enable container-mongodb.service
systemctl --user enable container-backend.service
systemctl --user start container-mongodb.service
systemctl --user start container-backend.service
```

### 6. Check status:
```bash
systemctl --user status container-mongodb.service
systemctl --user status container-backend.service
podman ps
```
