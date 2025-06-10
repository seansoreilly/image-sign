# PowerShell deployment script for Vercel
# Equivalent to the provided bash script

Write-Host "Starting Vercel deployment..." -ForegroundColor Green

# Run vercel deploy and capture stdout/stderr to files
vercel deploy > deployment-url.txt 2> error.txt

# Check the exit code
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    
    # Read the deployment URL from stdout file
    $deploymentUrl = Get-Content deployment-url.txt -Raw
    $deploymentUrl = $deploymentUrl.Trim()
    
    Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Cyan
    
    # Alias the deployment to the custom domain
    Write-Host "Setting up alias to image-sign.vercel.app..." -ForegroundColor Yellow
    vercel alias $deploymentUrl image-sign.vercel.app
    
    $aliasExitCode = $LASTEXITCODE
    if ($aliasExitCode -eq 0) {
        Write-Host "Successfully aliased to image-sign.vercel.app" -ForegroundColor Green
        Write-Host "Your site is live at: https://image-sign.vercel.app" -ForegroundColor Magenta
    }
    else {
        Write-Host "Warning: Deployment succeeded but aliasing failed" -ForegroundColor Yellow
    }
}
else {
    # Handle the error
    Write-Host "Deployment failed!" -ForegroundColor Red
    
    if (Test-Path error.txt) {
        $errorMessage = Get-Content error.txt -Raw
        $errorMessage = $errorMessage.Trim()
        Write-Host "Error details: $errorMessage" -ForegroundColor Red
    }
    else {
        Write-Host "No error details available" -ForegroundColor Red
    }
    
    # Exit with error code
    exit $exitCode
}

# Clean up temporary files
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item deployment-url.txt -ErrorAction SilentlyContinue
Remove-Item error.txt -ErrorAction SilentlyContinue

Write-Host "Deployment script completed." -ForegroundColor Green 