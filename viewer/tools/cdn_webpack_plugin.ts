import readPkgUp from 'read-pkg-up';
import resolvePkg from 'resolve-pkg';
import cdnFromModule from 'module-to-cdn';
import { Compiler, Configuration, ExternalModule } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';


const PLUGIN_NAME = 'cdn-webpack-plugin';
const MODULE_REGEX = /^((?:@[a-z0-9][\w-.]+\/)?[a-z0-9][\w-.]*)/;

class CdnWebpackPlugin {

  private _modulesFromCdn: OrderedMap;

  constructor () {
    this._modulesFromCdn = new OrderedMap();
  }

  apply (compiler: Compiler) {
    this._applyMain(compiler);
    this._applyHtmlWebpackPlugin(compiler);
  }

  _applyMain (compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, nmf => {
      nmf.hooks.factorize.tapAsync(PLUGIN_NAME, async (data, cb) => {
        const modulePath = data.dependencies[0].request;
        const contextPath = data.context;

        const isModulePath = MODULE_REGEX.test(modulePath);
        if (!isModulePath) {
          return cb();
        }

        const varName = await this._addModule(contextPath, modulePath, compiler.options.mode);
        if (!varName) {
          return cb();
        } else {
          cb(null, new ExternalModule(varName, 'var', modulePath));
        }
      });
    });
  }

  async _addModule (contextPath: string, modulePath: string, mode: Configuration['mode']) {
    const match = modulePath.match(MODULE_REGEX);
    if (!match) {
      return null;
    }
    const moduleName = match[0];
    const info = await this._getPkgInfo(contextPath, moduleName);
    if (!info) {
      return null;
    }
    const { version, peerDependencies } = info;

    const cache = this._modulesFromCdn.get(modulePath);
    if (cache) {
      const isSameVersion = cache.version === version;
      if (isSameVersion) {
        return cache.var;
      }
      return null;
    }

    const cdnConfig = await getCDNFromModule(modulePath, version, { env: mode });
    if (!cdnConfig) {
      return null;
    }

    if (peerDependencies) {
      const jobs = Object.keys(peerDependencies).map(peerDependencyName => (
        this._addModule(contextPath, peerDependencyName, mode)
      ));
      const rv = await Promise.all(jobs);
      const arePeerDependenciesLoaded = rv.every(_ => !!_);
      if (!arePeerDependenciesLoaded) {
        return null;
      }
    }

    this._modulesFromCdn.set(modulePath, cdnConfig);

    return cdnConfig.var;
  }

  async _getPkgInfo (contextPath: string, moduleName: string) {
    const cwd = resolvePkg(moduleName, {
      cwd: contextPath,
    });
    let rv = await readPkgUp({ cwd });
    if (!rv) {
      return null;
    }
    const { packageJson } = rv;
    return {
      version: packageJson.version,
      peerDependencies: packageJson.peerDependencies,
    };
  }

  _applyHtmlWebpackPlugin (compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      const hwpHooks = HtmlWebpackPlugin.getHooks(compilation);
      hwpHooks.beforeAssetTagGeneration.tapAsync(PLUGIN_NAME, (data, cb) => {
        const assets = this._modulesFromCdn.values();
        const urls = assets.map(_ => _.url);
        data.assets.js = urls.concat(data.assets.js);
        cb(null, data);
      });
    });
  }

}


class OrderedMap {

  private _dict: Map<string, ModuleConfig>;
  private _list: string[];

  constructor () {
    this._dict = new Map<string, ModuleConfig>();
    this._list = [];
  }

  get (key: string) {
    if (!this._dict.has(key)) {
      return undefined;
    }
    return this._dict.get(key);
  }

  set (key: string, value: ModuleConfig) {
    if (!this._dict.has(key)) {
      this._list.push(key);
    }
    this._dict.set(key, value);
  }

  values () {
    return this._list.map(key => this._dict.get(key)).filter(<T>(value: T | undefined): value is T => {
      return !!value;
    });
  }

}


async function getCDNFromModule (moduleName: string, version: string, options: { env: Configuration['mode'] }) {
  if (moduleName === 'react-virtualized') {
    return {
      name: moduleName,
      var: 'ReactVirtualized',
      url: `https://unpkg.com/react-virtualized@${version}/dist/umd/react-virtualized.js`,
      version,
    };
  }
  const cdnConfig = await cdnFromModule(moduleName, version, options);
  if (!cdnConfig) {
    return null;
  }
  return cdnConfig;
}


export default CdnWebpackPlugin;
