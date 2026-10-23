// All arithmetic is done in integer paise (1 rupee = 100 paise) so there is no floating-point drift.

function toPaise(value) {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid money value: ${value}`);
  const paise = Number(match[2]) * 100 + Number((match[3] || '').padEnd(2, '0'));
  return match[1] ? -paise : paise;
}

const fromPaise = (paise) => paise / 100;

// "1234.50" string for NUMERIC columns
function toDecimal(paise) {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

function formatInr(paise) {
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

module.exports = { toPaise, fromPaise, toDecimal, formatInr };
