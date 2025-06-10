declare module 'png-chunks-extract' {
  interface Chunk {
    name: string;
    data: Uint8Array;
  }
  export default function extract(data: Buffer | Uint8Array): Chunk[];
}

declare module 'png-chunks-encode' {
  interface Chunk {
    name: string;
    data: Uint8Array;
  }
  export default function encode(chunks: Chunk[]): Uint8Array;
}

declare module 'png-chunk-text' {
  interface TextChunk {
    keyword: string;
    text: string;
  }
  export function encode(keyword: string, text: string): { name: 'tEXt', data: Uint8Array };
  export function decode(data: Uint8Array): TextChunk;
}

// This is a global type, it doesn't need to be in a module.
interface PngChunk {
  name: string;
  data: Uint8Array;
} 