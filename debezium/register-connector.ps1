# Registra o conector Debezium no Kafka Connect via REST API.
# Execute APÓS o kafka-connect estar saudável (docker compose up -d --wait).

param(
  [string]$KafkaConnectUrl = "http://localhost:8083"
)

Write-Host "Verificando Kafka Connect em $KafkaConnectUrl..."
$maxAttempts = 20
$attempt = 0

do {
  try {
    $status = Invoke-RestMethod -Uri "$KafkaConnectUrl/connectors" -Method GET -ErrorAction Stop
    Write-Host "Kafka Connect pronto. Conectores ativos: $($status.Count)"
    break
  } catch {
    $attempt++
    Write-Host "Tentativa $attempt/$maxAttempts — aguardando Kafka Connect..."
    Start-Sleep -Seconds 5
  }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
  Write-Error "Kafka Connect não respondeu após $maxAttempts tentativas."
  exit 1
}

# Verifica se o conector já existe
$existing = Invoke-RestMethod -Uri "$KafkaConnectUrl/connectors/bubber-driver-connector" -Method GET -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Conector 'bubber-driver-connector' já existe. Excluindo para re-registrar..."
  Invoke-RestMethod -Uri "$KafkaConnectUrl/connectors/bubber-driver-connector" -Method DELETE | Out-Null
  Start-Sleep -Seconds 2
}

# Registra o conector
$connectorJson = Get-Content -Raw -Path "$PSScriptRoot/driver-connector.json"
$response = Invoke-RestMethod `
  -Uri "$KafkaConnectUrl/connectors" `
  -Method POST `
  -ContentType "application/json" `
  -Body $connectorJson

Write-Host ""
Write-Host "Conector registrado com sucesso!"
Write-Host "  Nome:   $($response.name)"
Write-Host "  Status: $(Invoke-RestMethod -Uri "$KafkaConnectUrl/connectors/$($response.name)/status" | Select-Object -ExpandProperty connector | Select-Object -ExpandProperty state)"
Write-Host ""
Write-Host "Topico Kafka gerado: driver_db.public.drivers"
Write-Host "Acesse o Kafka UI em: http://localhost:8080"
