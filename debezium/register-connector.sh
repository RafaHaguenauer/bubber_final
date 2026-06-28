#!/bin/bash
# Registra o conector Debezium no Kafka Connect via REST API.
# Execute APÓS o kafka-connect estar saudável:
#   docker compose up -d --wait
#   bash debezium/register-connector.sh

KAFKA_CONNECT_URL="${1:-http://localhost:8083}"
CONNECTOR_FILE="$(dirname "$0")/driver-connector.json"
MAX_ATTEMPTS=20
ATTEMPT=0

echo "Verificando Kafka Connect em $KAFKA_CONNECT_URL..."
until curl -sf "$KAFKA_CONNECT_URL/connectors" > /dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "Kafka Connect nao respondeu apos $MAX_ATTEMPTS tentativas."
    exit 1
  fi
  echo "Tentativa $ATTEMPT/$MAX_ATTEMPTS — aguardando Kafka Connect..."
  sleep 5
done

echo "Kafka Connect pronto."

# Remove conector anterior se existir
if curl -sf "$KAFKA_CONNECT_URL/connectors/bubber-driver-connector" > /dev/null; then
  echo "Conector existente encontrado — removendo..."
  curl -s -X DELETE "$KAFKA_CONNECT_URL/connectors/bubber-driver-connector"
  sleep 2
fi

# Registra o conector
echo "Registrando conector Debezium..."
curl -s -X POST "$KAFKA_CONNECT_URL/connectors" \
  -H "Content-Type: application/json" \
  -d @"$CONNECTOR_FILE" | jq '.'

echo ""
echo "Topico Kafka gerado: driver_db.public.drivers"
echo "Acesse o Kafka UI em: http://localhost:8080"
