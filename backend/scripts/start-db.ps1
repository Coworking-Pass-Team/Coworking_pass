# Script to start PostgreSQL server in the background
$pgBin = "C:\Program Files\PostgreSQL\17\bin\postgres.exe"
$pgData = "C:\Program Files\PostgreSQL\17\data"

$isOpen = (Test-NetConnection -Port 5432 -ComputerName localhost -WarningAction SilentlyContinue).TcpTestSucceeded
if ($isOpen) {
    Write-Host "PostgreSQL is already running on port 5432." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path $pgBin)) {
    Write-Error "PostgreSQL binary not found at $pgBin"
    exit 1
}

Write-Host "Starting PostgreSQL server in background..." -ForegroundColor Cyan
Start-Process -FilePath $pgBin -ArgumentList "-D `"$pgData`"" -WindowStyle Hidden

# Wait for database to be ready
$retries = 15
while ($retries -gt 0) {
    Start-Sleep -Seconds 1
    $isOpen = (Test-NetConnection -Port 5432 -ComputerName localhost -WarningAction SilentlyContinue).TcpTestSucceeded
    if ($isOpen) {
        Write-Host "PostgreSQL is up and running on port 5432!" -ForegroundColor Green
        exit 0
    }
    $retries--
}

Write-Error "Failed to start PostgreSQL within 15 seconds."
exit 1
