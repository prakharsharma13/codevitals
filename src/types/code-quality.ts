export interface FileLength {
  path: string;
  lines: number;
}

export interface CodeQualityResult {
  averageFileLength: number;
  largestFile: FileLength | null;
  smallestFile: FileLength | null;
  largeFunctionWarnings: string[];
  deepFolderWarnings: string[];
  namingWarnings: string[];
  recommendations: string[];
}
