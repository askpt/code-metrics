# Changelog

## [0.3.2](https://github.com/askpt/code-metrics/compare/v0.3.1...v0.3.2) (2026-04-20)


### 🐛 Bug Fixes

* escape regex metacharacters in glob exclude patterns ([#235](https://github.com/askpt/code-metrics/issues/235)) ([dd06c47](https://github.com/askpt/code-metrics/commit/dd06c477273a20f16cbcf9bbb83034802ec0950a))


### 🧹 Chore

* **deps:** Pin and update development dependencies ([#245](https://github.com/askpt/code-metrics/issues/245)) ([5f1c749](https://github.com/askpt/code-metrics/commit/5f1c74996cb1c070fbbfe47a95f045aa97f0a873))


### 🚀 Performance

* upgrade analysis cache from FIFO to LRU eviction ([#246](https://github.com/askpt/code-metrics/issues/246)) ([37d89c1](https://github.com/askpt/code-metrics/commit/37d89c171321321a3885d8b9ffbedfb36feef1d9))

## [0.3.1](https://github.com/askpt/code-metrics/compare/v0.3.0...v0.3.1) (2026-04-01)


### 🚀 Performance

* cache parsers and analysis results to reduce per-keystroke overhead ([#222](https://github.com/askpt/code-metrics/issues/222)) ([1f2f4d3](https://github.com/askpt/code-metrics/commit/1f2f4d3b8e8be4069e81e5fb81c4cf39a53c68d6))


### 🔄 Refactoring

* extract generic createAnalyzer helper and implement showFunctionDetails command ([#230](https://github.com/askpt/code-metrics/issues/230)) ([6f507ae](https://github.com/askpt/code-metrics/commit/6f507ae835331b4fe74fe81332dd17aed25ff403))

## [0.3.0](https://github.com/askpt/code-metrics/compare/v0.2.0...v0.3.0) (2026-03-19)


### 🐛 Bug Fixes

* remove incorrect % symbol from complexity score in CodeLens title ([#158](https://github.com/askpt/code-metrics/issues/158)) ([d90d8bf](https://github.com/askpt/code-metrics/commit/d90d8bfc1db3380ba922fd47ee4fc9eaf10b9828))


### ✨ New Features

* add JavaScript and TypeScript cognitive complexity support ([#164](https://github.com/askpt/code-metrics/issues/164)) ([4ce549c](https://github.com/askpt/code-metrics/commit/4ce549cc11feaa3010eaf85d9c02f3c180c0316d))

## [0.2.0](https://github.com/askpt/code-metrics/compare/v0.1.6...v0.2.0) (2025-12-24)


### 🐛 Bug Fixes

* Update complexity calculations in CSharpMetricsAnalyzer ([#115](https://github.com/askpt/code-metrics/issues/115)) ([0bbfbeb](https://github.com/askpt/code-metrics/commit/0bbfbebd1b1fd09dfdb200607d707c21c43d8c00))


### ✨ New Features

* Add Go language support and enhance metrics analysis ([#113](https://github.com/askpt/code-metrics/issues/113)) ([6061073](https://github.com/askpt/code-metrics/commit/60610730d09572899cfde8935dfb8978ad4831bd))

## [0.1.6](https://github.com/askpt/code-metrics/compare/v0.1.5...v0.1.6) (2025-11-28)


### 🐛 Bug Fixes

* upgrade engines.vscode to ^1.106.0 to match @types/vscode version ([#99](https://github.com/askpt/code-metrics/issues/99)) ([fa6b821](https://github.com/askpt/code-metrics/commit/fa6b8219e565cc5e121fde8a84897f56531ed0f7))

## [0.1.5](https://github.com/askpt/code-metrics/compare/v0.1.4...v0.1.5) (2025-11-28)


### 🐛 Bug Fixes

* Register CodeLens command to suppress click error ([#97](https://github.com/askpt/code-metrics/issues/97)) ([8b3e87e](https://github.com/askpt/code-metrics/commit/8b3e87e27376674b9806482574633040ac1b0676))

## [0.1.4](https://github.com/askpt/code-metrics/compare/v0.1.3...v0.1.4) (2025-09-21)


### 🐛 Bug Fixes

* Enhance C# metrics analyzer for preprocessor directive complexity ([#44](https://github.com/askpt/code-metrics/issues/44)) ([7e42f01](https://github.com/askpt/code-metrics/commit/7e42f011433f978b0f7bd5dd2c590c4bbe170d1f))


### 🧹 Chore

* Add logo and fix icon path in package.json ([#34](https://github.com/askpt/code-metrics/issues/34)) ([7072d7e](https://github.com/askpt/code-metrics/commit/7072d7e28a6bc8b689c5080d74bc3448ab342d00))
* Update CHANGELOG.md with recent changes ([#36](https://github.com/askpt/code-metrics/issues/36)) ([ae74e05](https://github.com/askpt/code-metrics/commit/ae74e053b799c5d1582d22b1279a0c3b6894f5a4))

## [0.1.3](https://github.com/askpt/code-metrics/compare/v0.1.2...v0.1.3) (2025-09-20)


### 🐛 Bug Fixes

* Update displayName to 'Code Complexity Metrics' ([#29](https://github.com/askpt/code-metrics/issues/29)) ([eb210f2](https://github.com/askpt/code-metrics/commit/eb210f28d31cf406c1e26301d56edd6122f8cc30))

## [0.1.2](https://github.com/askpt/code-metrics/compare/v0.1.1...v0.1.2) (2025-09-20)


### 🐛 Bug Fixes

* Rename to Code Metrics ([#27](https://github.com/askpt/code-metrics/issues/27)) ([e415094](https://github.com/askpt/code-metrics/commit/e4150946728fc1dcf21089e6d95eefc7ca3e6d82))

## [0.1.1](https://github.com/askpt/code-complexity/compare/v0.1.0...v0.1.1) (2025-09-20)


### 🐛 Bug Fixes

* Update package.json with publisher and repository information ([#25](https://github.com/askpt/code-complexity/issues/25)) ([dd7df79](https://github.com/askpt/code-complexity/commit/dd7df79b913ed3e90973524e57e49c9d8dad15d8))
* update publisher and repository information in package.json ([dd7df79](https://github.com/askpt/code-complexity/commit/dd7df79b913ed3e90973524e57e49c9d8dad15d8))

## [0.1.0](https://github.com/askpt/code-complexity/compare/v0.0.1...v0.1.0) (2025-09-20)


### 🐛 Bug Fixes

* correct formatting and structure in package.json ([#24](https://github.com/askpt/code-complexity/issues/24)) ([5218704](https://github.com/askpt/code-complexity/commit/521870456809b5e4d526524020a3238a7293f269))
* unit test execution ([#20](https://github.com/askpt/code-complexity/issues/20)) ([c867aae](https://github.com/askpt/code-complexity/commit/c867aae46b74a086a229ac3b9971fe826745cbe7))
* update dependabot to use conventional commit types ([#7](https://github.com/askpt/code-complexity/issues/7)) ([af10651](https://github.com/askpt/code-complexity/commit/af10651d5fbec906a78ec62d232cdaf1d21f197a))
* update module target in tsconfig.json to node20 ([c3b7ddb](https://github.com/askpt/code-complexity/commit/c3b7ddbdda9d20327f31ca139ff71c3633f07046))


### ✨ New Features

* add CodeLens and code complexity integration ([#13](https://github.com/askpt/code-complexity/issues/13)) ([706fc08](https://github.com/askpt/code-complexity/commit/706fc08586f366aff7ef119e9cdbc7f425929bb7))
* Add configuration parameters ([#14](https://github.com/askpt/code-complexity/issues/14)) ([35cffaf](https://github.com/askpt/code-complexity/commit/35cffaf6da32c237be87e86c35c16e2c5889bd61))
* add Dependabot support for npm and GitHub Actions ([#3](https://github.com/askpt/code-complexity/issues/3)) ([0845adc](https://github.com/askpt/code-complexity/commit/0845adc7d5ae53cdab3a255408e5db0be52d8a53))
* add initial skeleton for the project ([950765e](https://github.com/askpt/code-complexity/commit/950765e9c171b58ec7f886dfb17397cc927ed2f0))
