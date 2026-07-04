# Changelog

## [0.8.0](https://github.com/askpt/code-metrics/compare/v0.7.0...v0.8.0) (2026-07-04)


### ✨ New Features

* analyze generator functions in JS/TS ([#435](https://github.com/askpt/code-metrics/issues/435)) ([90a1c37](https://github.com/askpt/code-metrics/commit/90a1c37cd318d87f8b96f3a4fef0f0813b1fe906))
* qualify JS/TS class method names with class name in CodeLens ([#421](https://github.com/askpt/code-metrics/issues/421)) ([d53fbea](https://github.com/askpt/code-metrics/commit/d53fbea7107b467ffb8d9c088db5f02ac7aa7f28))


### 🚀 Performance

* avoid details array spread copies and use O(1) body/sibling lookups ([#437](https://github.com/askpt/code-metrics/issues/437)) ([336fcaf](https://github.com/askpt/code-metrics/commit/336fcafca3e1c717ebcd2a9641632e5e0afc443c))
* hoist C# type-declaration Set to static readonly and use childForFieldName in Go receiver lookup ([#419](https://github.com/askpt/code-metrics/issues/419)) ([70ea90b](https://github.com/askpt/code-metrics/commit/70ea90bea409b4bf1f2dfdc38960eda6951fec5e))
* replace multi-comparison type chains with static readonly Sets ([#434](https://github.com/askpt/code-metrics/issues/434)) ([5ad9942](https://github.com/askpt/code-metrics/commit/5ad9942174b3f7a77f30a3429e0a4a0968466ce6))


### 🔄 Refactoring

* merge hasElseBranch into a single find() in Java analyzer visit() ([#418](https://github.com/askpt/code-metrics/issues/418)) ([3144f62](https://github.com/askpt/code-metrics/commit/3144f62035f0530e9335cf815beb9a10a98877ac))
* remove slice() allocation and use childForFieldName ([#423](https://github.com/askpt/code-metrics/issues/423)) ([d4e2940](https://github.com/askpt/code-metrics/commit/d4e294072d9ca3b165a5d2ffdd80f6cb7cb2bd14))
* replace O(n) children scans with O(1) firstNamedChild/childForFieldName lookups ([#427](https://github.com/askpt/code-metrics/issues/427)) ([09c078a](https://github.com/askpt/code-metrics/commit/09c078a31a2551000d4ce85802fa0eb6596b0668))

## [0.7.0](https://github.com/askpt/code-metrics/compare/v0.6.2...v0.7.0) (2026-06-26)


### 🐛 Bug Fixes

* count else_clause in Python cognitive complexity analyzer ([#410](https://github.com/askpt/code-metrics/issues/410)) ([d5d49b9](https://github.com/askpt/code-metrics/commit/d5d49b9dee3a033dc85d421f011d0e7aac69f8a1))


### ✨ New Features

* fix C# operator naming and add edge-case test coverage ([#409](https://github.com/askpt/code-metrics/issues/409)) ([3c93a5a](https://github.com/askpt/code-metrics/commit/3c93a5a058fa73b9a1b60838d89867ccaefa9b88))
* name JS/TS arrow functions used as object methods + expand coverage ([#404](https://github.com/askpt/code-metrics/issues/404)) ([ec952d8](https://github.com/askpt/code-metrics/commit/ec952d8c1e947189bca4a1e0ce6e7c438c9811a6))
* qualify C# method names with enclosing type and expand test coverage ([#401](https://github.com/askpt/code-metrics/issues/401)) ([fb3b47d](https://github.com/askpt/code-metrics/commit/fb3b47d07e5160b2ff09c3db0012ad3e805362e4))


### 🚀 Performance

* O(1) name lookup in jsLikeAnalyzer; defer name resolution in C# and Java analyzers ([#407](https://github.com/askpt/code-metrics/issues/407)) ([e52ffd0](https://github.com/askpt/code-metrics/commit/e52ffd0e57f90eb7fadcecde37856c0d3112db2a))
* skip redundant outer traversal in Go analyzer after function is found ([#417](https://github.com/askpt/code-metrics/issues/417)) ([bc86b5a](https://github.com/askpt/code-metrics/commit/bc86b5aacc702c5bf6c8ae6bce9436ccc108e572))
* use childForFieldName() for O(1) field access in Go, Java, Python, Rust analyzers ([#397](https://github.com/askpt/code-metrics/issues/397)) ([37e2bde](https://github.com/askpt/code-metrics/commit/37e2bdef8702a60d62d990e68be7839ab54b5264))
* use node.type for O(1) operator detection across Go, Rust, Python, JS/TS analyzers ([#412](https://github.com/askpt/code-metrics/issues/412)) ([0aef168](https://github.com/askpt/code-metrics/commit/0aef1681e8c8d7c216c3f6a2f1effc941ba4f85e))
* use O(1) positional child access for binary operator lookup ([#394](https://github.com/askpt/code-metrics/issues/394)) ([c66228b](https://github.com/askpt/code-metrics/commit/c66228b07a97599435add7299e5db17e0dcc19cc))


### 🔄 Refactoring

* extract hasLabel helper in goAnalyzer to eliminate duplication ([#395](https://github.com/askpt/code-metrics/issues/395)) ([ce31296](https://github.com/askpt/code-metrics/commit/ce3129638a1edca3e22017ccb2ce6d712d27bbdf))

## [0.6.2](https://github.com/askpt/code-metrics/compare/v0.6.1...v0.6.2) (2026-06-20)


### 🔄 Refactoring

* deduplicate visit-loop bodies across all language analyzers ([#389](https://github.com/askpt/code-metrics/issues/389)) ([02eceef](https://github.com/askpt/code-metrics/commit/02eceef991f8074cfbae882f58b0922a5c301c9b))

## [0.6.1](https://github.com/askpt/code-metrics/compare/v0.6.0...v0.6.1) (2026-06-19)


### 🚀 Performance

* add LRU refresh for configCache and prune analysisCache on document close ([#352](https://github.com/askpt/code-metrics/issues/352)) ([641a453](https://github.com/askpt/code-metrics/commit/641a453bf610c6e924de99fad07a54cf21084149))
* cache analyzeFile results by document URI + version ([#348](https://github.com/askpt/code-metrics/issues/348)) ([479f769](https://github.com/askpt/code-metrics/commit/479f769bdc6d573016df1331c733aed5faa6e0fa))
* cache per-path exclusion decisions in isExcluded ([#381](https://github.com/askpt/code-metrics/issues/381)) ([5472f3b](https://github.com/askpt/code-metrics/commit/5472f3bf3e2d8fb1e094437f9793ee0d08136a1b))
* check cancellation token before analysis and clarify code ([#354](https://github.com/askpt/code-metrics/issues/354)) ([4598d6d](https://github.com/askpt/code-metrics/commit/4598d6d050b261a86c3e542bd30688de457c209a))

## [0.6.0](https://github.com/askpt/code-metrics/compare/v0.5.0...v0.6.0) (2026-05-23)


### 🐛 Bug Fixes

* add TSX and JSX sample files and fix reports ([#302](https://github.com/askpt/code-metrics/issues/302)) ([401806e](https://github.com/askpt/code-metrics/commit/401806e48376046545c36e6979f28cdd61b353b2))
* correct formatting and structure in package.json ([#24](https://github.com/askpt/code-metrics/issues/24)) ([5218704](https://github.com/askpt/code-metrics/commit/521870456809b5e4d526524020a3238a7293f269))
* Enhance C# metrics analyzer for preprocessor directive complexity ([#44](https://github.com/askpt/code-metrics/issues/44)) ([7e42f01](https://github.com/askpt/code-metrics/commit/7e42f011433f978b0f7bd5dd2c590c4bbe170d1f))
* escape regex metacharacters in glob exclude patterns ([#235](https://github.com/askpt/code-metrics/issues/235)) ([dd06c47](https://github.com/askpt/code-metrics/commit/dd06c477273a20f16cbcf9bbb83034802ec0950a))
* pass X11 display env vars to vscode-test subprocess under xvfb-run ([4b005f9](https://github.com/askpt/code-metrics/commit/4b005f9edc4b9dadd47655ca2a5aca2c272391b3))
* Register CodeLens command to suppress click error ([#97](https://github.com/askpt/code-metrics/issues/97)) ([8b3e87e](https://github.com/askpt/code-metrics/commit/8b3e87e27376674b9806482574633040ac1b0676))
* remove incorrect % symbol from complexity score in CodeLens title ([#158](https://github.com/askpt/code-metrics/issues/158)) ([d90d8bf](https://github.com/askpt/code-metrics/commit/d90d8bfc1db3380ba922fd47ee4fc9eaf10b9828))
* Rename to Code Metrics ([#27](https://github.com/askpt/code-metrics/issues/27)) ([e415094](https://github.com/askpt/code-metrics/commit/e4150946728fc1dcf21089e6d95eefc7ca3e6d82))
* support ? wildcard in isExcluded glob pattern matching ([#270](https://github.com/askpt/code-metrics/issues/270)) ([ce22c0d](https://github.com/askpt/code-metrics/commit/ce22c0d8c42088ce3d6e4a0f8d93bfe2410be0e6))
* unit test execution ([#20](https://github.com/askpt/code-metrics/issues/20)) ([c867aae](https://github.com/askpt/code-metrics/commit/c867aae46b74a086a229ac3b9971fe826745cbe7))
* Update complexity calculations in CSharpMetricsAnalyzer ([#115](https://github.com/askpt/code-metrics/issues/115)) ([0bbfbeb](https://github.com/askpt/code-metrics/commit/0bbfbebd1b1fd09dfdb200607d707c21c43d8c00))
* update dependabot to use conventional commit types ([#7](https://github.com/askpt/code-metrics/issues/7)) ([af10651](https://github.com/askpt/code-metrics/commit/af10651d5fbec906a78ec62d232cdaf1d21f197a))
* Update displayName to 'Code Complexity Metrics' ([#29](https://github.com/askpt/code-metrics/issues/29)) ([eb210f2](https://github.com/askpt/code-metrics/commit/eb210f28d31cf406c1e26301d56edd6122f8cc30))
* update module target in tsconfig.json to node20 ([c3b7ddb](https://github.com/askpt/code-metrics/commit/c3b7ddbdda9d20327f31ca139ff71c3633f07046))
* Update package.json with publisher and repository information ([#25](https://github.com/askpt/code-metrics/issues/25)) ([dd7df79](https://github.com/askpt/code-metrics/commit/dd7df79b913ed3e90973524e57e49c9d8dad15d8))
* update publisher and repository information in package.json ([dd7df79](https://github.com/askpt/code-metrics/commit/dd7df79b913ed3e90973524e57e49c9d8dad15d8))
* upgrade engines.vscode to ^1.106.0 to match @types/vscode version ([#99](https://github.com/askpt/code-metrics/issues/99)) ([fa6b821](https://github.com/askpt/code-metrics/commit/fa6b8219e565cc5e121fde8a84897f56531ed0f7))
* use implementing type name for Rust trait impl methods ([#329](https://github.com/askpt/code-metrics/issues/329)) ([fd1e8f9](https://github.com/askpt/code-metrics/commit/fd1e8f91be04d4c98887ab42866bfc49c267ed33))


### ✨ New Features

* add CodeLens and code complexity integration ([#13](https://github.com/askpt/code-metrics/issues/13)) ([706fc08](https://github.com/askpt/code-metrics/commit/706fc08586f366aff7ef119e9cdbc7f425929bb7))
* add cognitive complexity analysis for Java ([#296](https://github.com/askpt/code-metrics/issues/296)) ([6f9e355](https://github.com/askpt/code-metrics/commit/6f9e35529e152984555bc614d876f5bdf573fdb4))
* add cognitive complexity analysis for Python ([#297](https://github.com/askpt/code-metrics/issues/297)) ([3964283](https://github.com/askpt/code-metrics/commit/3964283745f8e1bbc38cebbdc4baa77f3fcee97c))
* Add configuration parameters ([#14](https://github.com/askpt/code-metrics/issues/14)) ([35cffaf](https://github.com/askpt/code-metrics/commit/35cffaf6da32c237be87e86c35c16e2c5889bd61))
* add Dependabot support for npm and GitHub Actions ([#3](https://github.com/askpt/code-metrics/issues/3)) ([0845adc](https://github.com/askpt/code-metrics/commit/0845adc7d5ae53cdab3a255408e5db0be52d8a53))
* Add Go language support and enhance metrics analysis ([#113](https://github.com/askpt/code-metrics/issues/113)) ([6061073](https://github.com/askpt/code-metrics/commit/60610730d09572899cfde8935dfb8978ad4831bd))
* add initial skeleton for the project ([950765e](https://github.com/askpt/code-metrics/commit/950765e9c171b58ec7f886dfb17397cc927ed2f0))
* add JavaScript and TypeScript cognitive complexity support ([#164](https://github.com/askpt/code-metrics/issues/164)) ([4ce549c](https://github.com/askpt/code-metrics/commit/4ce549cc11feaa3010eaf85d9c02f3c180c0316d))
* add Rust language support with cognitive complexity analysis ([#327](https://github.com/askpt/code-metrics/issues/327)) ([6e2ba04](https://github.com/askpt/code-metrics/commit/6e2ba0489685ce8b0265688636bd93396b6db6e1))


### 🧹 Chore

* Add logo and fix icon path in package.json ([#34](https://github.com/askpt/code-metrics/issues/34)) ([7072d7e](https://github.com/askpt/code-metrics/commit/7072d7e28a6bc8b689c5080d74bc3448ab342d00))
* **deps:** Pin and update development dependencies ([#245](https://github.com/askpt/code-metrics/issues/245)) ([5f1c749](https://github.com/askpt/code-metrics/commit/5f1c74996cb1c070fbbfe47a95f045aa97f0a873))
* **main:** release 0.1.0 ([#1](https://github.com/askpt/code-metrics/issues/1)) ([85da630](https://github.com/askpt/code-metrics/commit/85da630408b11e6e3428f629a0c3e9a99de67a29))
* **main:** release 0.1.1  ([#26](https://github.com/askpt/code-metrics/issues/26)) ([43e8522](https://github.com/askpt/code-metrics/commit/43e8522b08f072da614d23538c909f934bebb3bb))
* **main:** release 0.1.2 ([#28](https://github.com/askpt/code-metrics/issues/28)) ([0a51638](https://github.com/askpt/code-metrics/commit/0a51638dec2d9f1d37184e00030202797d3266be))
* **main:** release 0.1.3 ([#30](https://github.com/askpt/code-metrics/issues/30)) ([cdcbee1](https://github.com/askpt/code-metrics/commit/cdcbee13622bb284bfd45add0b9e5c4aafa719a1))
* **main:** release 0.1.4 ([#35](https://github.com/askpt/code-metrics/issues/35)) ([db88cf0](https://github.com/askpt/code-metrics/commit/db88cf05a9337f43e43767f66ad043babaf47b1b))
* **main:** release 0.1.5 ([#98](https://github.com/askpt/code-metrics/issues/98)) ([aad84c6](https://github.com/askpt/code-metrics/commit/aad84c69319a9debd1b2bef1d73b46e7dfbd9677))
* **main:** release 0.1.6 ([#100](https://github.com/askpt/code-metrics/issues/100)) ([78cbb6c](https://github.com/askpt/code-metrics/commit/78cbb6cbef48af1273177bb8b4f276e95d618d46))
* **main:** release 0.2.0 ([#117](https://github.com/askpt/code-metrics/issues/117)) ([8a19337](https://github.com/askpt/code-metrics/commit/8a193379821839e31d87606d9c5e4506da5a4c4e))
* **main:** release 0.3.0 ([#161](https://github.com/askpt/code-metrics/issues/161)) ([63a32ca](https://github.com/askpt/code-metrics/commit/63a32caf9f7256e17319cd7559e01881f348d0be))
* **main:** release 0.3.1 ([#226](https://github.com/askpt/code-metrics/issues/226)) ([653ce6c](https://github.com/askpt/code-metrics/commit/653ce6cb726364e5caf3f93efbf2f4418907a613))
* **main:** release 0.3.2 ([#239](https://github.com/askpt/code-metrics/issues/239)) ([a688647](https://github.com/askpt/code-metrics/commit/a6886471b3f5c22df4711009718b7798913977b3))
* **main:** release 0.3.3 ([#268](https://github.com/askpt/code-metrics/issues/268)) ([689f6a8](https://github.com/askpt/code-metrics/commit/689f6a87d13ef301a39817569b0037398b021f2b))
* **main:** release 0.3.4 ([#276](https://github.com/askpt/code-metrics/issues/276)) ([d402c52](https://github.com/askpt/code-metrics/commit/d402c52994ae02230061f2180f648f2d916ac8d2))
* **main:** release 0.4.0 ([#290](https://github.com/askpt/code-metrics/issues/290)) ([5145deb](https://github.com/askpt/code-metrics/commit/5145debede73db84b1eee8a23bcb709c9221ab2d))
* **main:** release 0.4.1 ([#303](https://github.com/askpt/code-metrics/issues/303)) ([015bd72](https://github.com/askpt/code-metrics/commit/015bd722df03f9cb531520134a2317c831fbf283))
* **main:** release 0.5.0 ([#325](https://github.com/askpt/code-metrics/issues/325)) ([658d724](https://github.com/askpt/code-metrics/commit/658d724fafc7f0073c7f23c4c1bafa5162f3ad78))
* Update CHANGELOG.md with recent changes ([#36](https://github.com/askpt/code-metrics/issues/36)) ([ae74e05](https://github.com/askpt/code-metrics/commit/ae74e053b799c5d1582d22b1279a0c3b6894f5a4))


### 🚀 Performance

* cache CodeMetricsConfig per workspace folder in provideCodeLenses ([#332](https://github.com/askpt/code-metrics/issues/332)) ([93a7588](https://github.com/askpt/code-metrics/commit/93a7588d35b76c2c1b9d13fc0c59a27ee17573b8))
* cache compiled exclude-pattern regexes in isExcluded ([#274](https://github.com/askpt/code-metrics/issues/274)) ([e4dae93](https://github.com/askpt/code-metrics/commit/e4dae93f7664c923b57a0878e09724d64e473d1b))
* cache parsers and analysis results to reduce per-keystroke overhead ([#222](https://github.com/askpt/code-metrics/issues/222)) ([1f2f4d3](https://github.com/askpt/code-metrics/commit/1f2f4d3b8e8be4069e81e5fb81c4cf39a53c68d6))
* cap excludeRegexCache at 32 entries with LRU eviction ([#301](https://github.com/askpt/code-metrics/issues/301)) ([571da7c](https://github.com/askpt/code-metrics/commit/571da7c5335d6e0a9d1dd176c060b3f1207d56dc))
* upgrade analysis cache from FIFO to LRU eviction ([#246](https://github.com/askpt/code-metrics/issues/246)) ([37d89c1](https://github.com/askpt/code-metrics/commit/37d89c171321321a3885d8b9ffbedfb36feef1d9))


### 🔄 Refactoring

* add isSupportedLanguage() for O(1) language lookup ([#305](https://github.com/askpt/code-metrics/issues/305)) ([a6fc92a](https://github.com/askpt/code-metrics/commit/a6fc92a181c2d58a6239590443d003a09a38f5e5))
* extract generic createAnalyzer helper and implement showFunctionDetails command ([#230](https://github.com/askpt/code-metrics/issues/230)) ([6f507ae](https://github.com/askpt/code-metrics/commit/6f507ae835331b4fe74fe81332dd17aed25ff403))
* extract shared base class for JavaScript and TypeScript analyzers ([#266](https://github.com/askpt/code-metrics/issues/266)) ([9d73035](https://github.com/askpt/code-metrics/commit/9d7303555d67db065e63f5df2261d29892e777f8))
* lazily cache resolved analyzeFile reference in createAnalyzer ([#275](https://github.com/askpt/code-metrics/issues/275)) ([5fc7d1f](https://github.com/askpt/code-metrics/commit/5fc7d1fa7ed5822464fced76d06b1c0bfad0b6e0))
* pass resolved config into createCodeLens to avoid redundant getConfiguration calls ([#285](https://github.com/askpt/code-metrics/issues/285)) ([cbdbe51](https://github.com/askpt/code-metrics/commit/cbdbe51e404e719f8fbcfe29a64578cbc452294a))
* strip pointer prefix from Go pointer receiver method names in CodeLens ([#324](https://github.com/askpt/code-metrics/issues/324)) ([a850de1](https://github.com/askpt/code-metrics/commit/a850de18d76e414c57e4696f90c2da6d244f7bfa))

## [0.5.0](https://github.com/askpt/code-metrics/compare/v0.4.1...v0.5.0) (2026-05-22)


### 🐛 Bug Fixes

* use implementing type name for Rust trait impl methods ([#329](https://github.com/askpt/code-metrics/issues/329)) ([fd1e8f9](https://github.com/askpt/code-metrics/commit/fd1e8f91be04d4c98887ab42866bfc49c267ed33))


### ✨ New Features

* add Rust language support with cognitive complexity analysis ([#327](https://github.com/askpt/code-metrics/issues/327)) ([6e2ba04](https://github.com/askpt/code-metrics/commit/6e2ba0489685ce8b0265688636bd93396b6db6e1))


### 🚀 Performance

* cache CodeMetricsConfig per workspace folder in provideCodeLenses ([#332](https://github.com/askpt/code-metrics/issues/332)) ([93a7588](https://github.com/askpt/code-metrics/commit/93a7588d35b76c2c1b9d13fc0c59a27ee17573b8))


### 🔄 Refactoring

* strip pointer prefix from Go pointer receiver method names in CodeLens ([#324](https://github.com/askpt/code-metrics/issues/324)) ([a850de1](https://github.com/askpt/code-metrics/commit/a850de18d76e414c57e4696f90c2da6d244f7bfa))

## [0.4.1](https://github.com/askpt/code-metrics/compare/v0.4.0...v0.4.1) (2026-05-16)


### 🐛 Bug Fixes

* add TSX and JSX sample files and fix reports ([#302](https://github.com/askpt/code-metrics/issues/302)) ([401806e](https://github.com/askpt/code-metrics/commit/401806e48376046545c36e6979f28cdd61b353b2))


### 🚀 Performance

* cap excludeRegexCache at 32 entries with LRU eviction ([#301](https://github.com/askpt/code-metrics/issues/301)) ([571da7c](https://github.com/askpt/code-metrics/commit/571da7c5335d6e0a9d1dd176c060b3f1207d56dc))


### 🔄 Refactoring

* add isSupportedLanguage() for O(1) language lookup ([#305](https://github.com/askpt/code-metrics/issues/305)) ([a6fc92a](https://github.com/askpt/code-metrics/commit/a6fc92a181c2d58a6239590443d003a09a38f5e5))

## [0.4.0](https://github.com/askpt/code-metrics/compare/v0.3.4...v0.4.0) (2026-05-13)


### ✨ New Features

* add cognitive complexity analysis for Java ([#296](https://github.com/askpt/code-metrics/issues/296)) ([6f9e355](https://github.com/askpt/code-metrics/commit/6f9e35529e152984555bc614d876f5bdf573fdb4))
* add cognitive complexity analysis for Python ([#297](https://github.com/askpt/code-metrics/issues/297)) ([3964283](https://github.com/askpt/code-metrics/commit/3964283745f8e1bbc38cebbdc4baa77f3fcee97c))


### 🔄 Refactoring

* pass resolved config into createCodeLens to avoid redundant getConfiguration calls ([#285](https://github.com/askpt/code-metrics/issues/285)) ([cbdbe51](https://github.com/askpt/code-metrics/commit/cbdbe51e404e719f8fbcfe29a64578cbc452294a))

## [0.3.4](https://github.com/askpt/code-metrics/compare/v0.3.3...v0.3.4) (2026-05-01)


### 🐛 Bug Fixes

* support ? wildcard in isExcluded glob pattern matching ([#270](https://github.com/askpt/code-metrics/issues/270)) ([ce22c0d](https://github.com/askpt/code-metrics/commit/ce22c0d8c42088ce3d6e4a0f8d93bfe2410be0e6))


### 🚀 Performance

* cache compiled exclude-pattern regexes in isExcluded ([#274](https://github.com/askpt/code-metrics/issues/274)) ([e4dae93](https://github.com/askpt/code-metrics/commit/e4dae93f7664c923b57a0878e09724d64e473d1b))


### 🔄 Refactoring

* lazily cache resolved analyzeFile reference in createAnalyzer ([#275](https://github.com/askpt/code-metrics/issues/275)) ([5fc7d1f](https://github.com/askpt/code-metrics/commit/5fc7d1fa7ed5822464fced76d06b1c0bfad0b6e0))

## [0.3.3](https://github.com/askpt/code-metrics/compare/v0.3.2...v0.3.3) (2026-04-26)


### 🔄 Refactoring

* extract shared base class for JavaScript and TypeScript analyzers ([#266](https://github.com/askpt/code-metrics/issues/266)) ([9d73035](https://github.com/askpt/code-metrics/commit/9d7303555d67db065e63f5df2261d29892e777f8))

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
