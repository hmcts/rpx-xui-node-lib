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
