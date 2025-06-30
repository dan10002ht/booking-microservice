#!/bin/bash
set -e

# Copy slave2 script to the correct location
cp /docker-entrypoint-initdb.d/01-init-slave2.sh /docker-entrypoint-initdb.d/01-init-slave.sh

echo "✅ Copied slave2 initialization script" 