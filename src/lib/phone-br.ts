/**
 * Normaliza telefone brasileiro para apenas dígitos com prefixo 55.
 */
export function normalizeBrCellphone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits.length) {
    return null;
  }
  if (digits.startsWith('55')) {
    if (digits.length < 12 || digits.length > 15) {
      return null;
    }
    return digits;
  }
  if (digits.length === 11 || digits.length === 10) {
    return `55${digits}`;
  }
  return null;
}

/**
 * MSISDN do chip M2M (pode vir do +CNUM com ou sem +55).
 */
export function normalizeSimMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits.length) {
    return null;
  }
  if (digits.startsWith('55')) {
    if (digits.length >= 12 && digits.length <= 15) {
      return digits;
    }
    return null;
  }
  if (digits.length >= 10 && digits.length <= 11) {
    return `55${digits}`;
  }
  return null;
}

/**
 * Destinatário no POST `/api/v2/send` da Comtele: DDD + número, sem o prefixo 55.
 */
export function toComteleReceivers(normalizedWith55: string): string {
  const d = normalizedWith55.replace(/\D/g, '');
  if (d.startsWith('55') && d.length >= 12) {
    return d.slice(2);
  }
  return d;
}
