#!/bin/bash
# Script to check syntax of all JavaScript files in the backend directory
echo "Checking syntax of JavaScript files in backend..."
cd backend

# Check each file individually
echo "Checking routes/api.js:"
node -c routes/api.js
echo "Checking monitor.js:"
node -c monitor.js
echo "Checking config.js:"
node -c config.js
echo "Checking server.js:"
node -c server.js

# Check all .js files
echo -e "\nChecking all .js files:"
find . -name "*.js" -exec node -c {} \;
echo "Syntax check complete."