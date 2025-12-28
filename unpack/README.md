# unpack

Toolchain minimal require C++20.

Other libraries you will need:

* Boost.Locale
* Boost.URL
* libarchive

For Debian based system:

```sh
apt install libboost-locale-dev libboost-url-dev libarchive-dev
```

For Mac OS X which using Homebrew:

```sh
brew install boost libarchive
```

You may need to add the above libraries to CMAKE_PREFIX_PATH, because Homebrew
wont do that for you, e.g.:

```sh
export CMAKE_PREFIX_PATH="/opt/homebrew/opt/libarchive"
```
