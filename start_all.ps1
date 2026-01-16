$root = Get-Location

# Start Server
Write-Host "Starting Server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev"

# Start Client
Write-Host "Starting Client..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host "Both services started in separate windows."
