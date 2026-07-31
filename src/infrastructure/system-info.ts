export class SystemInfo {
  getNodeVersion(): string {
    return process.version;
  }
  getPlatform(): string {
    return process.platform;
  }
}
