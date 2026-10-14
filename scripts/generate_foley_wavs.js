import fs from 'fs';
import path from 'path';

function createWavBuffer(sampleRate, samples) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 32768 : s * 32767;
    buffer.writeInt16LE(Math.floor(intSample), offset);
    offset += 2;
  }

  return buffer;
}

const sampleRate = 44100;
const sfxDir = path.resolve('public/assets/audio/sfx');
if (!fs.existsSync(sfxDir)) fs.mkdirSync(sfxDir, { recursive: true });

// 1. paper_rustle.wav (0.45s of organic cellulose rustle)
{
  const duration = 0.45;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  let filterState = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const rawNoise = Math.random() * 2 - 1;
    // Bandpass smoothing
    filterState += 0.25 * (rawNoise - filterState);
    const flutter = Math.sin(t * 35) * Math.sin(t * 70) * 0.5 + 0.5;
    const env = Math.pow(Math.sin((t / duration) * Math.PI), 1.8);
    samples[i] = (filterState * 0.7 + (Math.random() * 2 - 1) * 0.3) * env * flutter * 0.85;
  }
  fs.writeFileSync(path.join(sfxDir, 'paper_rustle.wav'), createWavBuffer(sampleRate, samples));
}

// 2. door_heavy.wav (0.8s of heavy industrial steel blastdoor unseal)
{
  const duration = 0.8;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Mechanical initial clunk + sub bass boom + metal clang
    const latchTransient = Math.sin(2 * Math.PI * 480 * t) * Math.exp(-t * 60) * 0.6;
    const subBoom = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 4.5) * 0.8;
    const plateResonance = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 7.0) * 0.4;
    const airHiss = (Math.random() * 2 - 1) * Math.exp(-t * 3.5) * 0.15;
    samples[i] = (latchTransient + subBoom + plateResonance + airHiss) * Math.min(1, (duration - t) / 0.1);
  }
  fs.writeFileSync(path.join(sfxDir, 'door_heavy.wav'), createWavBuffer(sampleRate, samples));
}

// 3. door_latch.wav (0.22s of crisp spring-loaded deadbolt click)
{
  const duration = 0.22;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const strike = Math.sin(2 * Math.PI * 920 * t) * Math.exp(-t * 75) * 0.7;
    const returnSnap = t > 0.04 ? Math.sin(2 * Math.PI * 640 * (t - 0.04)) * Math.exp(-(t - 0.04) * 85) * 0.8 : 0;
    const resonance = Math.sin(2 * Math.PI * 260 * t) * Math.exp(-t * 25) * 0.3;
    samples[i] = strike + returnSnap + resonance;
  }
  fs.writeFileSync(path.join(sfxDir, 'door_latch.wav'), createWavBuffer(sampleRate, samples));
}

// 4. drawer_wood.wav (0.5s of teak/oak wood slide and bumper thud)
{
  const duration = 0.5;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  let woodFilter = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Wood slide friction
    const noise = Math.random() * 2 - 1;
    woodFilter += 0.12 * (noise - woodFilter);
    const slideEnv = t < 0.38 ? (t / 0.1) * (1 - t / 0.45) : 0;
    const slide = woodFilter * slideEnv * 0.45;
    // Bumper stop thud at t = 0.36
    const thudT = t - 0.36;
    const thud = thudT > 0 ? (Math.sin(2 * Math.PI * 115 * thudT) + Math.sin(2 * Math.PI * 180 * thudT) * 0.5) * Math.exp(-thudT * 22) * 0.85 : 0;
    samples[i] = slide + thud;
  }
  fs.writeFileSync(path.join(sfxDir, 'drawer_wood.wav'), createWavBuffer(sampleRate, samples));
}

// 5. clock_tick.wav (0.09s vintage synchronous clock escapement tick)
{
  const duration = 0.09;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const jewelStrike = Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t * 110) * 0.6;
    const palletTick = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 65) * 0.7;
    const bodyResonance = Math.sin(2 * Math.PI * 340 * t) * Math.exp(-t * 40) * 0.3;
    samples[i] = jewelStrike + palletTick + bodyResonance;
  }
  fs.writeFileSync(path.join(sfxDir, 'clock_tick.wav'), createWavBuffer(sampleRate, samples));
}

// 6. pneumatic_hiss.wav (0.75s of pressurized airlock / vacuum tube release)
{
  const duration = 0.75;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  let noiseBuf = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const rawNoise = Math.random() * 2 - 1;
    // Resonant sweep from 1800Hz to 400Hz
    const cutoff = 0.35 * (1 - (t / duration) * 0.65);
    noiseBuf += cutoff * (rawNoise - noiseBuf);
    const env = Math.exp(-t * 4.2) * (t < 0.03 ? t / 0.03 : 1);
    samples[i] = noiseBuf * env * 0.85;
  }
  fs.writeFileSync(path.join(sfxDir, 'pneumatic_hiss.wav'), createWavBuffer(sampleRate, samples));
}

// 7. glass_clink.wav (0.6s of high-purity glass/crystal decanter clink)
{
  const duration = 0.6;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fundamental = Math.sin(2 * Math.PI * 2350 * t);
    const harmonic1 = Math.sin(2 * Math.PI * 4710 * t) * 0.4;
    const harmonic2 = Math.sin(2 * Math.PI * 7080 * t) * 0.15;
    const env = Math.exp(-t * 7.5);
    samples[i] = (fundamental + harmonic1 + harmonic2) * env * 0.75;
  }
  fs.writeFileSync(path.join(sfxDir, 'glass_clink.wav'), createWavBuffer(sampleRate, samples));
}

// 8. switch_knife.wav (0.35s heavy ceramic knife switch throw with brass contact clatter)
{
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const bladeFriction = t < 0.08 ? (Math.random() * 2 - 1) * Math.sin((t / 0.08) * Math.PI) * 0.25 : 0;
    const strikeT = t - 0.08;
    const contactSnap = strikeT > 0 ? Math.sin(2 * Math.PI * 1250 * strikeT) * Math.exp(-strikeT * 55) * 0.8 : 0;
    const chassisThud = strikeT > 0 ? Math.sin(2 * Math.PI * 165 * strikeT) * Math.exp(-strikeT * 18) * 0.65 : 0;
    samples[i] = bladeFriction + contactSnap + chassisThud;
  }
  fs.writeFileSync(path.join(sfxDir, 'switch_knife.wav'), createWavBuffer(sampleRate, samples));
}

console.log('Successfully synthesized 8 high-fidelity Foley sound files in public/assets/audio/sfx/');
