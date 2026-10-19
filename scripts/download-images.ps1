# Downloads food photography for the Al Haider Pizza House website into public/images
$ErrorActionPreference = 'Stop'
$dir = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\images'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$items = @(
  @{n='pizza-1'; u='https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=70&fm=jpg'},
  @{n='pizza-2'; u='https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=70&fm=jpg'},
  @{n='pizza-3'; u='https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&q=70&fm=jpg'},
  @{n='pizza-4'; u='https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=900&q=70&fm=jpg'},
  @{n='pizza-5'; u='https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=900&q=70&fm=jpg'},
  @{n='pizza-6'; u='https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=900&q=70&fm=jpg'},
  @{n='pizza-7'; u='https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=900&q=70&fm=jpg'},
  @{n='pizza-8'; u='https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=900&q=70&fm=jpg'},
  @{n='burger-1'; u='https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=70&fm=jpg'},
  @{n='burger-2'; u='https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&q=70&fm=jpg'},
  @{n='burger-3'; u='https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=900&q=70&fm=jpg'},
  @{n='burger-4'; u='https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=900&q=70&fm=jpg'},
  @{n='burger-5'; u='https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=900&q=70&fm=jpg'},
  @{n='fries-1'; u='https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900&q=70&fm=jpg'},
  @{n='fries-2'; u='https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900&q=70&fm=jpg'},
  @{n='wrap-1'; u='https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=900&q=70&fm=jpg'},
  @{n='wrap-2'; u='https://images.unsplash.com/photo-1665222932114-6c52e1d486c1?w=900&q=70&fm=jpg'},
  @{n='wings-1'; u='https://images.unsplash.com/photo-1608039755401-742074f0548d?w=900&q=70&fm=jpg'},
  @{n='wings-2'; u='https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=900&q=70&fm=jpg'},
  @{n='nuggets-1'; u='https://images.unsplash.com/photo-1562967914-608f82629710?w=900&q=70&fm=jpg'},
  @{n='broast-1'; u='https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&q=70&fm=jpg'},
  @{n='broast-2'; u='https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=900&q=70&fm=jpg'},
  @{n='sandwich-1'; u='https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=70&fm=jpg'},
  @{n='sandwich-2'; u='https://images.unsplash.com/photo-1553909489-cd47e0907980?w=900&q=70&fm=jpg'},
  @{n='soup-1'; u='https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=70&fm=jpg'},
  @{n='soup-2'; u='https://images.unsplash.com/photo-1604909052743-94e838986d24?w=900&q=70&fm=jpg'},
  @{n='pasta-1'; u='https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&q=70&fm=jpg'},
  @{n='pasta-2'; u='https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&q=70&fm=jpg'},
  @{n='drink-1'; u='https://images.unsplash.com/photo-1546171753-97d7676e4602?w=900&q=70&fm=jpg'},
  @{n='drink-2'; u='https://images.unsplash.com/photo-1554866585-cd94860890b7?w=900&q=70&fm=jpg'},
  @{n='momo-1'; u='https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=900&q=70&fm=jpg'},
  @{n='hero-main'; u='https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=1600&q=75&fm=jpg'},
  @{n='about-1'; u='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=70&fm=jpg'},
  @{n='kitchen-1'; u='https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=70&fm=jpg'}
)

$fail = @()
foreach ($it in $items) {
  $out = Join-Path $dir ($it.n + '.jpg')
  try {
    Invoke-WebRequest -Uri $it.u -OutFile $out -TimeoutSec 40 -MaximumRedirection 6
    Start-Sleep -Milliseconds 150
    $len = (Get-Item $out).Length
    $fs = [System.IO.File]::OpenRead($out)
    $b1 = $fs.ReadByte(); $b2 = $fs.ReadByte()
    $fs.Close()
    $ok = ($len -gt 8000) -and ($b1 -eq 0xFF) -and ($b2 -eq 0xD8)
    if (-not $ok) { $fail += $it.n; Remove-Item $out -Force }
  } catch {
    $fail += $it.n
    if (Test-Path $out) { Remove-Item $out -Force }
  }
}

Write-Output ('TOTAL=' + $items.Count)
Write-Output ('DOWNLOADED=' + ($items.Count - $fail.Count))
Write-Output ('FAILED=' + ($fail -join ', '))
