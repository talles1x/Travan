/**
 * Gera um "Pix copia e cola" no padrão BR Code (EMV) com CRC16.
 * A chave é de demonstração: nenhum dinheiro é movimentado.
 */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function pixPayload({
  key,
  name,
  city,
  amount,
  txid,
}: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid: string;
}) {
  const account = field('00', 'br.gov.bcb.pix') + field('01', key);
  const payload =
    field('00', '01') +
    field('26', account) +
    field('52', '0000') +
    field('53', '986') +
    field('54', amount.toFixed(2)) +
    field('58', 'BR') +
    field('59', name.slice(0, 25)) +
    field('60', city.slice(0, 15)) +
    field('62', field('05', txid.slice(0, 25))) +
    '6304';
  return payload + crc16(payload);
}
