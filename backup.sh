#!/bin/bash

# Load environment variables from server/.env
if [ -f server/.env ]; then
    # Export variables from .env file
    export $(grep -v '^#' server/.env | xargs)
else
    echo "Error: server/.env file not found!"
    exit 1
fi

# Check if required variables are set
if [ -z "$MONGO_INITDB_ROOT_USERNAME" ] || [ -z "$MONGO_INITDB_ROOT_PASSWORD" ]; then
    echo "Error: MONGO_INITDB_ROOT_USERNAME or MONGO_INITDB_ROOT_PASSWORD not set in server/.env"
    exit 1
fi

# Backup folder inside your home directory
BACKUP_DIR=~/mongo-backups/$(date +%F_%H-%M-%S)

# Create the backup folder
mkdir -p "$BACKUP_DIR"

echo "Starting MongoDB backup..."
echo "Username: $MONGO_INITDB_ROOT_USERNAME"
echo "Backup location: $BACKUP_DIR"

# Run mongodump inside the container with authentication
podman exec mongodb mongodump \
    --username "$MONGO_INITDB_ROOT_USERNAME" \
    --password "$MONGO_INITDB_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --out /tmp/backup-temp

# Check if mongodump succeeded
if [ $? -eq 0 ]; then
    echo "mongodump completed successfully"
    
    # Copy the dump from container to host backup folder
    podman cp mongodb:/tmp/backup-temp/. "$BACKUP_DIR"
    
    if [ $? -eq 0 ]; then
        echo "Backup copied to host successfully"
        
        # Remove temporary dump inside container
        podman exec mongodb rm -rf /tmp/backup-temp
        
        # Remove backups older than 7 days
        find ~/mongo-backups/* -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null
        
        echo "MongoDB backup completed at $(date) into $BACKUP_DIR"
        
        # Show backup size
        echo "Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
        
    else
        echo "Failed to copy backup from container"
        exit 1
    fi
else
    echo "mongodump failed"
    exit 1
fi