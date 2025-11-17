# Test Bearer Token Authentication on Production
Write-Host "`n🔍 Testing Bearer Token Authentication on Production Server`n" -ForegroundColor Cyan
Write-Host "=" * 70

# Step 1: Login and get token
Write-Host "`n1️⃣ Logging in to get access token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "testbearer@example.com"
        password = "TestPass123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "https://kindreddev.tanushchauhan.com/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -TimeoutSec 10

    $token = $loginResponse.session.access_token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token (first 50 chars): $($token.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test Bearer token authentication
Write-Host "`n2️⃣ Testing Bearer token authentication on /api/me..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $profileResponse = Invoke-RestMethod -Uri "https://kindreddev.tanushchauhan.com/api/me" `
        -Method GET `
        -Headers $headers `
        -TimeoutSec 10

    Write-Host "✅ SUCCESS! Bearer token authentication is WORKING!" -ForegroundColor Green
    Write-Host "   User ID: $($profileResponse.id)" -ForegroundColor Gray
    Write-Host "   Email: $($profileResponse.email)" -ForegroundColor Gray
    Write-Host "   Role: $($profileResponse.role)" -ForegroundColor Gray
    
    Write-Host "`n" + ("=" * 70)
    Write-Host "🎉 VERIFIED: Bearer token authentication is deployed and working!" -ForegroundColor Green
    Write-Host "=" * 70
    
} catch {
    Write-Host "❌ FAILED: Bearer token authentication NOT working" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   This means the changes are NOT deployed yet." -ForegroundColor Yellow
    exit 1
}
