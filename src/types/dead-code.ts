export interface LargeFile {
  path: string;
  lines: number;
  size: number;
}

export interface DeadCodeResult {
  unusedFiles: string[];
  emptyDirectories: string[];
  largeFiles: LargeFile[];
  orphanFiles: string[];
}
