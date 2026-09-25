param(
  [int]$Port = 4173,
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

$gameRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$port = $Port
$url = "http://localhost:$port/"
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)

try {
  $listener.Start()
} catch {
  # Another copy is already serving the game, so simply show it.
  if (-not $NoOpen) { Start-Process $url }
  exit 0
}

if (-not $NoOpen) { Start-Process $url }
Write-Host "Oli Moonlight Adventure is open: $url"
Write-Host 'Keep this window open while playing. Close it to stop the server.'

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )
  $headerText = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
  $Stream.Flush()
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
      while (($headerLine = $reader.ReadLine()) -ne '') {
        if ($null -eq $headerLine) { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2 -or $parts[0] -ne 'GET') {
        Send-Response $stream 405 'Method Not Allowed' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
        continue
      }

      $requestPath = $parts[1].Split('?')[0]
      $relativePath = [Uri]::UnescapeDataString($requestPath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
      $targetPath = [System.IO.Path]::GetFullPath((Join-Path $gameRoot $relativePath))
      $insideRoot = $targetPath.Equals($gameRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
        $targetPath.StartsWith($gameRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)

      if (-not $insideRoot -or -not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
        Send-Response $stream 404 'Not Found' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Not Found'))
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($targetPath)
      $extension = [System.IO.Path]::GetExtension($targetPath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
      Send-Response $stream 200 'OK' $contentType $body
    } catch {
      Write-Warning $_.Exception.Message
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
