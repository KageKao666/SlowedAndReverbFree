class StreamingAudioDecoder {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.chunkSize = 1024 * 1024; // 1MB
    }
    async decodeAudioStreaming(file) {
        try {
            if (file.size > this.chunkSize * 2) {
                return await this.decodeFileInChunks(file);
            }
            return await this.decodeFileStandard(file);
        } catch (error) {
            console.error('Ошибка streaming декодирования, переход на стандартный метод:', error);
            return this.decodeFileStandard(file);
        }
    }
    async decodeFileInChunks(file) {
        const chunks = [];
        for (let offset = 0; offset < file.size; offset += this.chunkSize) {
            chunks.push(file.slice(offset, offset + this.chunkSize));
        }
        const decodePromises = chunks.map(chunk => chunk.arrayBuffer().then(b => this.audioContext.decodeAudioData(b)));
        const decodedChunks = await Promise.all(decodePromises);
        return this.mergeAudioBuffers(decodedChunks);
    }
    async decodeFileStandard(file) {
        const arrayBuffer = await file.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
    }
    mergeAudioBuffers(buffers) {
        if (!buffers || buffers.length === 0) return null;
        if (buffers.length === 1) return buffers[0];
        const first = buffers[0];
        const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
        const merged = this.audioContext.createBuffer(first.numberOfChannels, totalLength, first.sampleRate);
        let offset = 0;
        for (const buffer of buffers) {
            for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
                merged.getChannelData(ch).set(buffer.getChannelData(ch), offset);
            }
            offset += buffer.length;
        }
        return merged;
    }
}
window.StreamingAudioDecoder = StreamingAudioDecoder;