# unpack

Toolchain minimal require C++20.

Other libraries you will need:

* Boost.Locale
* libarchive
* libcurl

For Debian based system:

```sh
apt install libboost-locale-dev libarchive-dev libcurl4-openssl-dev
```

For Mac OS X which using Homebrew:

```sh
brew install boost libarchive curl
```

You may need to add the above libraries to CMAKE_PREFIX_PATH, because Homebrew
wont do that for you, e.g.:

```sh
export CMAKE_PREFIX_PATH="/usr/local/opt/libarchive:/usr/local/opt/openssl"
```
