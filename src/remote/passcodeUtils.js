// remote/passcodeUtils.js
// Handles passcode hashing and localStorage storage.
// The raw passcode is NEVER stored — only the SHA-256 hash.
//
// crypto.subtle is only available in secure contexts (HTTPS / localhost).
// A pure-JS SHA-256 fallback handles plain-HTTP local-network deployments.

const STORAGE_KEY = "mosque_remote_passcode_hash";

// ── Pure-JS SHA-256 (fallback for HTTP) ────────────────────────────────────────
function _rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

function _sha256Pure(message) {
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08, 0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  const bytes = new TextEncoder().encode(message);
  const len = bytes.length;
  const blocks = Math.ceil((len + 9) / 64);
  const padded = new Uint32Array(blocks * 16);

  for (let i = 0; i < len; i++)
    padded[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
  padded[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
  const bitLen = len * 8;
  padded[padded.length - 2] = Math.floor(bitLen / 0x100000000);
  padded[padded.length - 1] = bitLen >>> 0;

  const h = H.slice();
  const W = new Uint32Array(64);

  for (let b = 0; b < blocks; b++) {
    const off = b * 16;
    for (let t = 0; t < 16; t++) W[t] = padded[off + t];
    for (let t = 16; t < 64; t++) {
      const s0 = _rotr(W[t-15],7) ^ _rotr(W[t-15],18) ^ (W[t-15] >>> 3);
      const s1 = _rotr(W[t-2],17) ^ _rotr(W[t-2],19) ^ (W[t-2] >>> 10);
      W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
    }
    let [a,b2,c,d,e,f,g,hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1  = _rotr(e,6) ^ _rotr(e,11) ^ _rotr(e,25);
      const ch  = (e & f) ^ (~e & g);
      const t1  = (hh + S1 + ch + K[t] + W[t]) >>> 0;
      const S0  = _rotr(a,2) ^ _rotr(a,13) ^ _rotr(a,22);
      const maj = (a & b2) ^ (a & c) ^ (b2 & c);
      const t2  = (S0 + maj) >>> 0;
      hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b2; b2=a; a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b2)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
  }
  return h.map(v => v.toString(16).padStart(8,'0')).join('');
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function hashPasscode(raw) {
  if (crypto?.subtle?.digest) {
    const data = new TextEncoder().encode(raw);
    const buf  = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
  }
  return _sha256Pure(raw);
}

export function hasPasscode() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export async function verifyPasscode(raw) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  return (await hashPasscode(raw)) === stored;
}

export async function savePasscode(raw) {
  localStorage.setItem(STORAGE_KEY, await hashPasscode(raw));
}

export function clearPasscode() {
  localStorage.removeItem(STORAGE_KEY);
}
