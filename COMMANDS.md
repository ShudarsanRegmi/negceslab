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