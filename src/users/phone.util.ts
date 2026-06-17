const PHONE_DIGITS = /^\d{10,15}$/;

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!PHONE_DIGITS.test(digits)) {
    throw new Error('Telefone inválido');
  }
  return `+${digits}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return '****';
  }
  return `****${digits.slice(-4)}`;
}
