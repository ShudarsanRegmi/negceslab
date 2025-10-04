## Create admin user inside the container

```bash
podman exec -it backend node makeAdmin.js
```

## Create podman secret

```bash
echo "secret" | podman secret create mongo-root-password -
podman secret ls
```
