import { MAX_INPUT_BYTES } from './limits';

export type FileReadResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function readTextFile(file: File): Promise<FileReadResult> {
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, error: '파일이 1MB 제한을 초과했습니다.' };
  }
  const text = await file.text();
  return { ok: true, text };
}
