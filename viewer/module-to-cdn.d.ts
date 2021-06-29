interface ModuleConfig {
  name: string;
  var: string;
  url: string;
  version: string;
}

declare module 'module-to-cdn' {
  import { Configuration } from 'webpack';

  const cdnFromModule: (moduleName: string, version: string, options: { env: Configuration['mode'] }) => Promise<ModuleConfig>;
  export default cdnFromModule;
}
