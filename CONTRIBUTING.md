# Contributing

## Releasing

Changelog and releasing are automated with npm scripts and actions.
To create a release:

- Navigate to the Actions tab.
- Select the `Version and Release` action.
- Trigger the action, specifying the semantic version bump that is needed.
- Changelog, GitHub release, and npm publish are handled by the action.
- An in-depth review of this system is documented at [bret.io/projects/package-automation](https://bret.io/projects/package-automation/).

If a local release is preferred, follow these steps:

- Ensure the Git workspace is clean.
- Run `npm version {patch, minor, major}`.
- Run `npm publish`.

## Guidelines

- Patches, ideas, and changes are welcome.
- Fixes are almost always welcome.
- Features are sometimes welcome.
- Please open an issue before spending significant time on a new feature.
- Stay within the style of the existing code.
- All tests must pass.
- New behavior and code paths must be tested.
- Aim for 100% test coverage.
