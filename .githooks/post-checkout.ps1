$branch = git rev-parse --abbrev-ref HEAD

if ($branch -eq "dev") {
    Copy-Item ".env.dev" ".env" -Force
    Write-Host "[Git Hook] Switched to DEV branch → .env set for DEV"
}
elseif ($branch -eq "master") {
    Copy-Item ".env.main" ".env" -Force
    Write-Host "[Git Hook] Switched to MAIN branch → .env set for MAIN"
}
else {
    Write-Host "[Git Hook] Branch '$branch' has no matching .env file. No change made."
}