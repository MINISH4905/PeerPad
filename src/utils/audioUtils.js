// Robust WavRecorder using native sample rate
export class WavRecorder {
  constructor() {
    this.audioContext = null;
    this.processor = null;
    this.input = null;
    this.leftChannel = [];
    this.recordingLength = 0;
    this.sampleRate = 0;
  }

  async start() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.input = this.audioContext.createMediaStreamSource(stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const chunk = e.inputBuffer.getChannelData(0);
      this.leftChannel.push(new Float32Array(chunk));
      this.recordingLength += chunk.length;
    };

    this.input.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    this.leftChannel = [];
    this.recordingLength = 0;
  }

  stop() {
    if (!this.processor) return null;
    
    this.processor.disconnect();
    this.input.disconnect();
    
    const data = this.flattenChannel(this.leftChannel, this.recordingLength);
    const wavBuffer = this.interleave(data);
    const view = this.createWavFile(wavBuffer);
    
    const blob = new Blob([view], { type: 'audio/wav' });
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    return blob;
  }

  flattenChannel(channel, length) {
    const result = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < channel.length; i++) {
      result.set(channel[i], offset);
      offset += channel[i].length;
    }
    return result;
  }

  interleave(data) {
    const buffer = new ArrayBuffer(data.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < data.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  createWavFile(buffer) {
    const out = new ArrayBuffer(44 + buffer.byteLength);
    const view = new DataView(out);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + buffer.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, buffer.byteLength, true);
    
    const final = new Uint8Array(out);
    final.set(new Uint8Array(buffer), 44);
    return final;
  }
}
