# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated deps.

## [0.4.2] - 2023-08-31

### Fixed

- Fix `Show Table Records` and `Describe Table` explorer commands.

## [0.4.1] - 2023-06-20

### Fixed

- Check TLS config for `undefined`.

## [0.4.0] - 2023-06-17

### Added

- Added TLS configuration option in connection schema.

### Changed

- Change icons and colors to match new ClickHouse design.

## [0.3.1] - 2023-04-14

### Fixed

- Fix empty output from queries that should return output.

## [0.3.0] - 2023-04-09

### Added

- Show query metrics.

### Changed

- Moved to [official client](https://github.com/Clickhouse/clickhouse-js).
  Incompatibility with ClickHouse < 22.8 possible, according to the
  [doc](https://clickhouse.com/docs/en/integrations/language-clients/javascript#compatibility-with-clickhouse).
- Use new official ClickHouse icon.
- Updated dependencies.

### Fixed

- Correctly display page size.

## [0.2.5] - 2023-01-17

### Changed

- Updated dependencies.

### Security

- Bump `json5` to fix prototype pollution (#322).

## [0.2.4] - 2022-12-26

### Changed

- Updated dependencies.

### Fixed

- Fixed CI/CD badge.

## [0.2.3] - 2022-07-24

### Changed

- Updated dependencies.

## [0.2.2] - 2022-04-23

### Changed

- Extension now bundled with `esbuild`.

## [0.2.1] - 2021-02-12

### Fixed

- Fixed driver loading.

## [0.2.0] - 2021-02-12

### Added

- More keywords.

### Fixed

- Fixed problem with export/save result;

## [0.1.0] - 2020-11-12

### Changed

- Normal readme.

### Fixed

- Fixed driver host and username settings;

## [0.0.1] - 2020-11-10

### Added

- Minimum functionality.
