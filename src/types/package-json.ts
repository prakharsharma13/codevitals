export interface PackageJson {
  name?: string;
  version?: string;

  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;

  workspaces?: string[] | { packages?: string[] };
}
