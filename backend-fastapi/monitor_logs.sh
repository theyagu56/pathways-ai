#!/bin/bash

echo "🔍 Monitoring Backend Logs..."
echo "Press Ctrl+C to stop monitoring"
echo "=================================="

# Monitor both server.log and app.log
tail -f server.log app.log 2>/dev/null | while read line; do
    # Add timestamps and color coding
    timestamp=$(date '+%H:%M:%S')
    echo "[$timestamp] $line"
done 