Write-Host "Stopping PostgreSQL server..." -ForegroundColor Cyan
$pgProcess = Get-Process -Name postgres -ErrorAction SilentlyContinue
if ($pgProcess) {
    $pgProcess | Stop-Process -Force
    Write-Host "PostgreSQL stopped." -ForegroundColor Green
} else {
    Write-Host "PostgreSQL is not running." -ForegroundColor Yellow
}
