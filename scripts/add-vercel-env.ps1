<#
Script: add-vercel-env.ps1
Descripción: Lee un archivo .env (por defecto .env en la raíz) y añade cada variable como variable de entorno en Vercel
Uso:
  pwsh .\scripts\add-vercel-env.ps1            # usa .env y agrega a production y preview
  pwsh .\scripts\add-vercel-env.ps1 -EnvFile ".env.production" -Envs @("production")

Advertencias:
- Ejecuta esto localmente. No compartas el contenido de tu .env.
- Asegúrate de haber hecho `vercel login` y de que el directorio del proyecto esté vinculado a tu proyecto en Vercel.
#>
param(
    [string]$EnvFile = ".env",
    [string[]]$Envs = @("production","preview"),
    [switch]$Force
)

function FailIfNoVercel() {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Error "Vercel CLI no está instalado o no está en PATH. Instálalo con: npm i -g vercel"
        exit 1
    }
}

FailIfNoVercel

if (-not (Test-Path $EnvFile)) {
    Write-Error "Archivo de entorno '$EnvFile' no encontrado. Pasa -EnvFile con la ruta correcta.";
    exit 1
}

# Leer líneas útiles
$lines = Get-Content $EnvFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }

if ($lines.Count -eq 0) {
    Write-Warning "No se encontraron variables en $EnvFile"
    exit 0
}

Write-Host "Se detectaron $($lines.Count) líneas de variables. Se añadirán a: $($Envs -join ', ')"
if (-not $Force) {
    $ok = Read-Host "¿Continuar? (y/n)"
    if ($ok -ne 'y' -and $ok -ne 'Y') { Write-Host "Operación cancelada"; exit 0 }
}

foreach ($line in $lines) {
    if ($line -match '^(?:export\s+)?([^=\s]+)=(.*)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        # eliminar comillas simples/dobles si las hay
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Trim('"') }
        if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Trim("'") }

        foreach ($env in $Envs) {
            Write-Host "Añadiendo variable '$key' al entorno '$env'..."
            try {
                # Ejecutar vercel env add y pasar el valor al STDIN usando ProcessStartInfo
                $psi = New-Object System.Diagnostics.ProcessStartInfo
                $psi.FileName = "vercel"
                $psi.Arguments = "env add $key $env"
                $psi.RedirectStandardInput = $true
                $psi.RedirectStandardOutput = $true
                $psi.RedirectStandardError = $true
                $psi.UseShellExecute = $false

                $proc = [System.Diagnostics.Process]::Start($psi)
                $proc.StandardInput.WriteLine($val)
                $proc.StandardInput.Close()

                $stdout = $proc.StandardOutput.ReadToEnd()
                $stderr = $proc.StandardError.ReadToEnd()
                $proc.WaitForExit()

                $exit = $proc.ExitCode
                if ($exit -ne 0) {
                    Write-Warning ("Fallo al añadir '{0}' a '{1}' (exitcode: {2}). stderr: {3}" -f $key, $env, $exit, $stderr)
                } else {
                    Write-Host "Añadida: $key -> $env"
                }
            } catch {
                Write-Warning ("Error al ejecutar vercel env add para {0}: {1}" -f $key, $_)
            }
        }
    } else {
        Write-Warning "Línea ignorada (no es KEY=VALUE): $line"
    }
}

Write-Host "Hecho. Recomendado: ejecutar un despliegue o `vercel --prod` para aplicar los cambios en producción."