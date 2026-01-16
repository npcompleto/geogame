@echo off
start "GeoGame Server" cmd /k "cd server && npm run dev"
start "GeoGame Client" cmd /k "cd client && npm run dev"
