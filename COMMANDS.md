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