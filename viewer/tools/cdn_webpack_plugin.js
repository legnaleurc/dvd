import readPkgUp from 'read-pkg-up';
import resolvePkg from 'resolve-pkg';
import cdnFromModule from 'module-to-cdn';
import ExternalModule from 'webpack/lib/ExternalModule';


const PLUGIN_NAME = 'cdn-webpack-plugin';
const MODULE_REGEX = /^((?:@[a-z0-9][\w-.]+\/)?[a-z0-9][\w-.]*)/;


class CdnWebpackPlugin {

  constructor () {
    this._modulesFromCdn = {};
  }

  apply (compiler) {
    this._applyMain(compiler);
    this._applyHtmlWebpackPlugin(compiler);
  }

  _applyMain (compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, nmf => {
      nmf.hooks.factory.tap(PLUGIN_NAME, factory => (async (data, cb) => {
        const modulePath = data.dependencies[0].request;
        const contextPath = data.context;

        const isModulePath = MODULE_REGEX.test(modulePath);
        if (!isModulePath) {
          return factory(data, cb);
        }

        const varName = await this._addModule(contextPath, modulePath, compiler.options.mode);
        if (varName === false) {
          factory(data, cb);
        } else if (!varName) {
          cb(null);
        } else {
          cb(null, new ExternalModule(varName, 'var', modulePath));
        }
      }));
    });
  }

  async _addModule (contextPath, modulePath, mode) {
    const moduleName = modulePath.match(MODULE_REGEX)[1];
    const {
      version,
      peerDependencies,
    } = await this._getPkgInfo(contextPath, moduleName);

    const cache = this._modulesFromCdn[modulePath];
    const isModuleAlreadyLoaded = !!cache;
    if (isModuleAlreadyLoaded) {
      const isSameVersion = cache.version === version;
      if (isSameVersion) {
        return cache.var;
      }
      return false;
    }

    const cdnConfig = await getCDNFromModule(modulePath, version, { env: mode });
    if (!cdnConfig) {
      return false;
    }

    if (peerDependencies) {
      let jobs = Object.keys(peerDependencies).map(peerDependencyName => (
        this._addModule(contextPath, peerDependencyName, mode)
      ));
      jobs = await Promise.all(jobs);
      const arePeerDependenciesLoaded = jobs.every(_ => !!_);
      if (!arePeerDependenciesLoaded) {
        return false;
      }
    }

    this._modulesFromCdn[modulePath] = cdnConfig;

    return cdnConfig.var;
  }

  async _getPkgInfo (contextPath, moduleName) {
    const cwd = resolvePkg(moduleName, {
      cwd: contextPath,
    });
    const { packageJson } = await readPkgUp({ cwd });
    return {
      version: packageJson.version,
      peerDependencies: packageJson.peerDependencies,
    };
  }

  _applyHtmlWebpackPlugin (compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(PLUGIN_NAME, (data, cb) => {
        let assets = Object.values(this._modulesFromCdn);
        hackOrder(assets);
        assets = assets.map(_ => _.url);
        data.assets.js = assets.concat(data.assets.js);
        cb(null, data);
      });
    });
  }

}


async function getCDNFromModule (moduleName, version, options) {
  const cdnConfig = await cdnFromModule(moduleName, version, options);
  if (!cdnConfig) {
    return null;
  }
  return cdnConfig;
}


// see reduxjs/react-redux#1366
function hackOrder (assets) {
  const reactDom = assets.findIndex(_ => _.name === 'react-dom');
  const reactRedux = assets.findIndex(_ => _.name === 'react-redux');
  if (reactDom < 0 || reactRedux < 0 ) {
    return;
  }
  if (reactDom > reactRedux) {
    [assets[reactDom], assets[reactRedux]] = [assets[reactRedux], assets[reactDom]];
  }
}


export default CdnWebpackPlugin;
