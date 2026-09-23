$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) { throw 'Start with the .env.example configuration described in README.md.' }
Write-Host 'Connect Gmail to LeadNest'
Write-Host 'Enable Google 2-Step Verification, then create an app password at https://myaccount.google.com/apppasswords'
Write-Host 'This checks your Gmail connection without sending email. Your app password stays in this local .env file.'
$senderAddress = (Read-Host 'Your Gmail or Google Workspace sender address').Trim().ToLowerInvariant()
if ($senderAddress -notmatch '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$') { throw 'Enter a valid sender email address.' }
$securePassword = Read-Host 'Google app password (hidden; not your normal Google password)' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$originalEnvironment = @{}
$settings = $null
try {
 $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) -replace '\s',''
 if ($appPassword -notmatch '^[a-zA-Z0-9]{16}$') { throw 'A Google app password has 16 characters. Create one in your Google account.' }
 $settings = @{ MAIL_MODE='smtp'; SMTP_HOST='smtp.gmail.com'; SMTP_PORT='465'; SMTP_USER=$senderAddress; SMTP_PASSWORD=$appPassword; MAIL_FROM=('LeadNest <' + $senderAddress + '>') }
 foreach ($key in $settings.Keys) { $originalEnvironment[$key] = [Environment]::GetEnvironmentVariable($key,'Process'); [Environment]::SetEnvironmentVariable($key,$settings[$key],'Process') }
 & node scripts/check-email.mjs
 if ($LASTEXITCODE -ne 0) { throw 'Gmail did not accept the connection. The existing .env file was not changed.' }
 $envContents = [IO.File]::ReadAllText((Join-Path $PSScriptRoot '.env'))
 foreach ($key in $settings.Keys) {
  $line = $key + '=' + $settings[$key]
  if ([regex]::IsMatch($envContents,('(?m)^' + $key + '=.*$'))) { $envContents = [regex]::Replace($envContents,('(?m)^' + $key + '=.*$'),$line) }
  else { $envContents += [Environment]::NewLine + $line }
 }
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'),$envContents,[Text.UTF8Encoding]::new($false))
 Write-Host 'Saved. Restart LeadNest, open Sign in > Resend verification email, and enter your account email.'
 Write-Host 'Open the received link on this computer, verify, then sign in from Chrome, Edge or another browser.'
} finally {
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
 $securePassword.Dispose()
 foreach ($key in $originalEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key,$originalEnvironment[$key],'Process') }
 $appPassword = $null; $settings = $null; $envContents = $null
}
