export interface VietQRParams {
  bankBin: string;
  accountNumber: string;
  amount: number;
  description: string;
  accountName?: string;
}

function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

function normalizeDescription(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

/**
 * Computes EMVCo CRC16-CCITT (initial value 0xFFFF, polynomial 0x1021).
 */
export function computeCRC16CCITT(payload: string): string {
  let crc = 0xffff;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(payload);

  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Builds an offline EMVCo / NAPAS 247 VietQR payload string.
 */
export function buildVietQRPayload(params: VietQRParams): string {
  const bankBin = params.bankBin.trim();
  const accountNumber = params.accountNumber.trim();
  const cleanAmount = Math.max(0, Math.round(params.amount));
  const cleanDesc = normalizeDescription(params.description || 'QLNT');

  const beneficiaryInfo = tlv('00', bankBin) + tlv('01', accountNumber);
  const merchantAccountInfo =
    tlv('00', 'A000000727') + tlv('01', beneficiaryInfo) + tlv('02', 'QRIBFTTA');

  const parts: string[] = [
    tlv('00', '01'),
    tlv('01', cleanAmount > 0 ? '12' : '11'),
    tlv('38', merchantAccountInfo),
    tlv('53', '704'),
  ];

  if (cleanAmount > 0) {
    parts.push(tlv('54', String(cleanAmount)));
  }

  parts.push(tlv('58', 'VN'));

  if (cleanDesc.length > 0) {
    parts.push(tlv('62', tlv('08', cleanDesc)));
  }

  const bodyWithoutCrc = parts.join('') + '6304';
  const crc = computeCRC16CCITT(bodyWithoutCrc);
  return bodyWithoutCrc + crc;
}

// ============================================================================
// Pure Offline QR Code Matrix Generator (Byte mode, ECC Level L, Versions 1-10)
// ============================================================================

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] ?? 0) + (GF_LOG[b] ?? 0)] ?? 0;
}

function rsGeneratorPoly(ecCount: number): Uint8Array {
  let poly: Uint8Array = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i]!;
    for (let j = 0; j < poly.length; j++) {
      const p = poly[j]!;
      next[j] = (next[j] ?? 0) ^ p;
      next[j + 1] = (next[j + 1] ?? 0) ^ gfMul(p, factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i]!;
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] = (res[i + j] ?? 0) ^ gfMul(gen[j]!, coef);
      }
    }
  }
  return res.slice(data.length);
}

interface QrVersionSpec {
  version: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocks: number;
  alignmentCenters: number[];
}

// ECC Level L specifications for QR Versions 1..10
const QR_SPECS_L: QrVersionSpec[] = [
  { version: 1, dataCodewords: 19, ecPerBlock: 7, blocks: 1, alignmentCenters: [] },
  { version: 2, dataCodewords: 34, ecPerBlock: 10, blocks: 1, alignmentCenters: [6, 18] },
  { version: 3, dataCodewords: 55, ecPerBlock: 15, blocks: 1, alignmentCenters: [6, 22] },
  { version: 4, dataCodewords: 80, ecPerBlock: 20, blocks: 1, alignmentCenters: [6, 26] },
  { version: 5, dataCodewords: 108, ecPerBlock: 26, blocks: 1, alignmentCenters: [6, 30] },
  { version: 6, dataCodewords: 136, ecPerBlock: 18, blocks: 2, alignmentCenters: [6, 34] },
  { version: 7, dataCodewords: 156, ecPerBlock: 20, blocks: 2, alignmentCenters: [6, 22, 38] },
  { version: 8, dataCodewords: 194, ecPerBlock: 24, blocks: 2, alignmentCenters: [6, 24, 42] },
  { version: 9, dataCodewords: 232, ecPerBlock: 30, blocks: 2, alignmentCenters: [6, 26, 46] },
  { version: 10, dataCodewords: 274, ecPerBlock: 18, blocks: 4, alignmentCenters: [6, 28, 50] },
];

function selectVersion(byteLength: number): QrVersionSpec {
  for (const spec of QR_SPECS_L) {
    const headerBits = spec.version <= 9 ? 12 : 20;
    const neededBytes = Math.ceil((headerBits + byteLength * 8 + 4) / 8);
    if (neededBytes <= spec.dataCodewords) {
      return spec;
    }
  }
  return QR_SPECS_L[QR_SPECS_L.length - 1]!;
}

function encodeCodewords(payloadBytes: Uint8Array, spec: QrVersionSpec): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  pushBits(payloadBytes.length, spec.version <= 9 ? 8 : 16);
  for (const b of payloadBytes) {
    pushBits(b, 8);
  }

  const maxBits = spec.dataCodewords * 8;
  const terminator = Math.min(4, maxBits - bits.length);
  pushBits(0, terminator);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data = new Uint8Array(spec.dataCodewords);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] ?? 0);
    }
    data[byteIdx++] = byte;
  }

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (byteIdx < spec.dataCodewords) {
    data[byteIdx++] = padBytes[padIdx % 2]!;
    padIdx++;
  }

  // Split into blocks, compute RS ECC, interleave
  const blockCount = spec.blocks;
  const baseBlockSize = Math.floor(spec.dataCodewords / blockCount);
  const extraBlocks = spec.dataCodewords % blockCount;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let offset = 0;
  for (let b = 0; b < blockCount; b++) {
    const len = baseBlockSize + (b >= blockCount - extraBlocks ? 1 : 0);
    const slice = data.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, spec.ecPerBlock));
  }

  const result: number[] = [];
  const maxDataLen = baseBlockSize + (extraBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) result.push(blk[i]!);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const ec of ecBlocks) {
      result.push(ec[i]!);
    }
  }

  return new Uint8Array(result);
}

function buildQrMatrix(payload: string): number[][] {
  const bytes = new TextEncoder().encode(payload);
  const spec = selectVersion(bytes.length);
  const size = spec.version * 4 + 17;
  const matrix: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setModule = (r: number, c: number, val: number, isFunc = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r]![c] = val;
      if (isFunc) reserved[r]![c] = true;
    }
  };

  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setModule(r, c, inOuter && (onBorder || inCenter) ? 1 : 0);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment patterns
  const centers = spec.alignmentCenters;
  for (const r of centers) {
    for (const c of centers) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.max(Math.abs(dr), Math.abs(dc)) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isDark ? 1 : 0);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const bit = i % 2 === 0 ? 1 : 0;
    if (!reserved[6]![i]) setModule(6, i, bit);
    if (!reserved[i]![6]) setModule(i, 6, bit);
  }

  // Dark module & reserve format info areas
  setModule(size - 8, 8, 1);
  for (let i = 0; i < 9; i++) {
    if (!reserved[8]![i]) setModule(8, i, 0);
    if (!reserved[i]![8]) setModule(i, 8, 0);
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[8]![size - 1 - i]) setModule(8, size - 1 - i, 0);
    if (!reserved[size - 1 - i]![8]) setModule(size - 1 - i, 8, 0);
  }

  // Reserve version info for version >= 7
  if (spec.version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        setModule(i, size - 11 + j, 0);
        setModule(size - 11 + j, i, 0);
      }
    }
  }

  // Place data bits (mask 0: (r + c) % 2 === 0)
  const codewords = encodeCodewords(bytes, spec);
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!reserved[r]![c]) {
          let bit = 0;
          if (bitIdx < totalBits) {
            bit = (codewords[bitIdx >> 3]! >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          const masked = (r + c) % 2 === 0 ? bit ^ 1 : bit;
          matrix[r]![c] = masked;
        }
      }
    }
    upward = !upward;
  }

  // Format information for ECC Level L (01) + Mask 0 (000) => precomputed BCH(15,5) ^ 0x5412 = 0x77C4
  const formatBits = 0x77c4;
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> i) & 1;
    if (i < 6) setModule(8, i, bit);
    else if (i < 8) setModule(8, i + 1, bit);
    else setModule(8, size - 15 + i, bit);

    if (i < 8) setModule(size - 1 - i, 8, bit);
    else if (i < 9) setModule(15 - i, 8, bit);
    else setModule(14 - i, 8, bit);
  }

  return matrix;
}

/**
 * Renders a 100% offline VietQR SVG string with zero external URLs or network calls.
 */
export function renderVietQRSvgString(params: VietQRParams, size = 220): string {
  const payload = buildVietQRPayload(params);
  const matrix = buildQrMatrix(payload);
  const quietZone = 2;
  const totalModules = matrix.length + quietZone * 2;

  const rects: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r]!;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 1) {
        rects.push(`<rect x="${c + quietZone}" y="${r + quietZone}" width="1" height="1"/>`);
      }
    }
  }

  return [
    `<svg viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}" role="img" aria-label="Ma VietQR thanh toan offline">`,
    `<rect width="${totalModules}" height="${totalModules}" fill="#ffffff"/>`,
    `<g fill="#111827">${rects.join('')}</g>`,
    `</svg>`,
  ].join('');
}
