#!/bin/bash

# Backup folder inside your home directory
BACKUP_DIR=~/mongo-backups/$(date +%F_%H-%M-%S)

# Create the backup folder
mkdir -p "$BACKUP_DIR"

# Run mongodump inside the container, output to host folder via bind mount
podman exec mongodb mongodump --out /tmp/backup-temp

# Copy the dump from container to host backup folder
podman cp mongodb:/tmp/backup-temp/. "$BACKUP_DIR"

# Remove temporary dump inside container
podman exec mongodb rm -rf /tmp/backup-temp

# remove backups older than 7 days
find ~/mongo-backups/* -type d -mtime +7 -exec rm -rf {} \;

echo "MongoDB backup completed at $(date) into $BACKUP_DIR"