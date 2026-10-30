RPX XUI NODE LIBRARY
====================

Overview
--------

@hmcts/rpx-xui-node-lib is a shared Node.js and TypeScript library for XUI
applications. It provides reusable authentication, OIDC, OAuth2, S2S,
session, HTTP, security-policy and supporting utility components.

The current package version and supported Node.js range are defined in
package.json. The published package contains the compiled dist/ directory.


Prerequisites
-------------

- Node.js 24.18.0 or a later version accepted by package.json.
- Yarn 4.5.1.
- Git Bash or WSL on Windows for shell commands that use Unix-style syntax.

Install dependencies from the repository root:

    corepack enable
    yarn install


Build and test
--------------

Build the TypeScript library and declaration files:

    yarn build

Watch for source changes and rebuild:

    yarn build:watch

Run unit tests:

    yarn test

Run tests in watch mode:

    yarn test:watch

Run tests with coverage:

    yarn test:coverage

Run the library lint checks:

    yarn ci:lint

Run the complete local CI sequence:

    yarn ci

The CI command installs dependencies, runs linting and builds the library.
Review the generated dist/ output and test results before publishing.


Use the package
---------------

Install the approved package version in the consuming application:

    yarn add @hmcts/rpx-xui-node-lib

The package exports authentication, session, common HTTP and utility modules
from src/index.ts. Keep peer dependency versions compatible with the consuming
Express and Helmet versions.


Calculate a user session timeout
--------------------------------

The getUserSessionTimeout function selects a session-timeout configuration for
a user's roles. Import it from the package:

    import { getUserSessionTimeout } from '@hmcts/rpx-xui-node-lib';

Provide the user's roles and a priority-ordered configuration:

    const sessionTimeouts = [
      {
        idleModalDisplayTime: 3,
        pattern: '-dwpresponsewriter',
        totalIdleTime: 12
      },
      {
        idleModalDisplayTime: 10,
        pattern: '-solicitor',
        totalIdleTime: 50
      },
      {
        idleModalDisplayTime: 10,
        pattern: '.',
        totalIdleTime: 480
      }
    ];

    const timeout = getUserSessionTimeout(userRoles, sessionTimeouts);

The first matching pattern wins. The final entry should normally be the
default wildcard pattern, represented by '.'. Timeout values are interpreted
by the consuming application according to its documented unit, usually
minutes before conversion for the UI.

Typical role values include:

    pui-organisation-manager
    pui-user-manager
    pui-finance-manager

The returned object contains the selected idleModalDisplayTime, pattern and
totalIdleTime. An Angular application can pass these values to the common
library's Timeout Notification Service.


Authentication and security
---------------------------

The library includes reusable authentication and security helpers. Follow the
consuming application's approved IDAM, OIDC, OAuth2, S2S, session and Helmet
configuration. Never commit credentials or use production secrets in local
tests.

Keep route credentials, session stores, Redis settings and security-policy
configuration environment-specific. Review the library's exported types and
tests before changing a shared authentication contract.


Development workflow
--------------------

1. Create a focused branch using the repository's Gitflow conventions.
2. Install dependencies with yarn install.
3. Make the source change under src/.
4. Add or update unit tests for the affected public behaviour.
5. Run yarn ci:lint, yarn test and yarn build.
6. Use conventional commits, preferably through:

       yarn commit

7. Review the generated declaration files and dist/ contents before release.

The repository uses commit hooks and conventional commit validation. Follow
the project's release process rather than pushing generated files manually.


Troubleshooting
---------------

Dependencies do not install

- Check the Node.js and Yarn versions.
- Run corepack enable and yarn install.
- Check that the workspace is not using stale node_modules or build output.

Build fails

- Run yarn ci:lint and yarn test to identify the failing layer.
- Check TypeScript and peer dependency compatibility.
- Remove generated output only through the repository's approved clean-up
  process before rebuilding.

Session timeout selection is unexpected

- Check the order of the sessionTimeouts array.
- Confirm that the final default pattern is present.
- Check the user's role spelling and the regular-expression pattern.
- Confirm the consuming UI uses the returned values in the intended units.


UK English and technical terminology
-------------------------------------

Use UK English in documentation, examples and support responses:

    organisation / organisations
    authorise / authorisation
    behaviour
    centre
    colour
    customise / customisation
    licence (noun) / license (verb)
    prioritise

Keep package names, TypeScript identifiers, role names, API fields, regular
expressions and route names unchanged when they form part of a technical
contract.


Licence
-------

This project is licensed under the MIT Licence.
