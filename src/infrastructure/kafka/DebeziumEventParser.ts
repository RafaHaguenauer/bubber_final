// Formato do evento Debezium com a transformação ExtractNewRecordState (SMT "unwrap").
// Com o SMT aplicado no conector, a mensagem contém os campos do registro diretamente,
// mais os campos adicionais __op, __table, __source_ts_ms.
// O Driver Service agora persiste o perfil completo do motorista nesta tabela.
export interface DebeziumDriverRecord {
  id: string
  name: string
  email: string
  phone: string
  password: string
  rating: number
  is_active: boolean
  lat: number
  lng: number
  is_available: boolean
  created_at: string | null
  updated_at: string | null
  __op: 'c' | 'u' | 'd' | 'r'
  __table: string
  __source_ts_ms: number
  __deleted?: string   // "true" quando __op = 'd' (modo rewrite)
}

export interface ParsedDriverEvent {
  op: 'c' | 'u' | 'd' | 'r'
  data: DebeziumDriverRecord
}

export function parseDriverCdcMessage(raw: Buffer | null): ParsedDriverEvent | null {
  if (!raw) return null    // tombstone Kafka — chave sem valor (delete compactado)
  try {
    const record = JSON.parse(raw.toString()) as DebeziumDriverRecord
    return { op: record.__op, data: record }
  } catch {
    return null
  }
}
