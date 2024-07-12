# serverless-lodash-plugin

This module was born out of sheer frustration: while building a Serverless Framework project, I just wanted a convenient way to set `provisionedConcurrency` conditionally to `1` or `0`.

Easy, right?

Unfortunately...

- I needed to deliver that value is as an environment variable.
- Environment variables are ONLY delivered into `serverless.yml` as strings.
- `provisionedConcurrency` HAS to be a number.

Bollocks. And while `serverless.yml` DOES support a few inline functions (like `parseBool`), it won't parse an integer.

Double bollocks.

Hence this plugin, which exposes the entire `lodash` library (plus some other goodies) as variables in `serverless.yml`.

In general, use it like this:

```yml
plugins:
  - serverless-lodash-plugin

someKey: ${lodash(<param1>, <param2>, ...):<functionName>}
```

Yes, putting the function name after the params is a little weird. But serverless parses the stuff in the parentheses as an array, so it makes sense. And all the usual rules apply with respect to Serverless variable parsing.

Some examples:

```yml
plugins:
  - serverless-lodash-plugin

iWantANumber: ${lodash(1, 2, 3):sum} # 6
# Equivalent to _.sum([1, 2, 3])

# Assuming env var THREE = '3'
meToo: ${_(1, 2, ${_(${env:THREE})parseInt}):sum} # 6
# Equivalent to _.sum([1, 2, parseInt(process.env.THREE)])

# The 'params' function converts the params into an array.
# You can pass a lodash function as a param, but only one level deep!
iWantAnArray: ${lodash(${lodash(1, 2, 3):params}, _.multiply):map} # [0, 2, 6]
# Equivalent to _.map([1, 2, 3], _.multiply)
```

That's it. Go nuts!
