#!/bin/bash
# Start Xvfb for headless testing
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb on display :99"
    Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
    # Wait a moment for Xvfb to start
    sleep 2
    echo "Xvfb started successfully"
else
    echo "Xvfb is already running"
fi