# rpx-xui-node-lib
Common Nodejs library components for XUI 

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![Semantic-Release](https://github.com/hmcts/rpx-xui-node-lib/workflows/Semantic-Release/badge.svg)

# Committing to this library  

It should be noted that this library adheres to the gitflow convention. 
Please use proper naming conventions for your feature/bug branches. Also,
when committing please use conventional commits (@see this [guide](https://medium.com/jobtome-engineering/how-to-generate-changelog-using-conventional-commits-10be40f5826c)). This style
is now enforced using git commit hooks and there are a number of ways to commit.

## Commitizen
This is the preferred way of generating a commit against this library as it ensures the commit is formatted correctly and also
allows you to interactively build your commit. To do so, you can either type ```yarn commit``` or ```git cz```

## Alternative
You can still use ```git commit``` however in doing so you have to manually enforce the commit standard and type (please be aware
that your commit will still get linted and may fail otherwise).

## Get User Session Timeout

getUserSessionTimeout() allows a 3rd party application to calculate the Session Notification Timeout for a User,
based on their User Roles, and an array of Session Notification Timeouts, as defined
by the 3rd party service.

Feature example:

A W&P User on Manage Cases should have a Total Idle Time of 12 minutes,
and should show the Session Timeout Modal 3 minutes before the end of their session.

Whereas a Manage Organisation application user should have an Total Idle Time of 50 minutes,
and should show the Session Timeout Modal 10 minutes before the end of their session.

### Session Notification Timeouts shape

```
"sessionTimeouts": [
    {
      "idleModalDisplayTime": 3,
      "pattern": "-dwpresponsewriter",
      "totalIdleTime": 12
    },
    {
      "idleModalDisplayTime": 3,
      "pattern": "-homeoffice",
      "totalIdleTime": 12
    },
    {
      "idleModalDisplayTime": 10,
      "pattern": "-solicitor",
      "totalIdleTime": 50
    },
    {
      "idleModalDisplayTime": 10,
      "pattern": ".",
      "totalIdleTime": 480
    }
  ]
```

The Session Timeout configuration should be in PRIORITY ORDER, with the DEFAULT for
this application being the last item in the array.

The application DEFAULT is defined using the wildcard pattern ie '.'

User Roles shape

```
[
    'pui-organisation-manager',
    'pui-user-manager',
    'pui-finance-manager',
]
```

### Steps to implement:

1. Include the node library within your package.json file ie.
```
yarn add @hmcts/rpx-xui-node-lib@latest --save
```
2. Import the function
```
import { getUserSessionTimeout } from '@hmcts/rpx-xui-node-lib'
```

3. Include the function call, and pass in the Users roles, and sessionTimeouts
as set by your team. @see above for shape inputs.

```
const sessionTimeout = getUserSessionTimeout(roles, sessionTimeouts)
```
4. Handle the returned object ie.
```
{
  "idleModalDisplayTime": 3,
  "pattern": "-homeoffice",
  "totalIdleTime": 12
}
```

This object can be passed through to an UI. If the UI is in Angular,
the Angular UI can then implement the Timeout Notification Service and Timeout Notification Service Modal,
which the object generated by this Node API can be transfered into.

@see https://github.com/hmcts/rpx-xui-common-lib#timeout-notification-service
for an example of how to integrate the Timeout Notification Service and Timeout Notification Service Modal.

END
