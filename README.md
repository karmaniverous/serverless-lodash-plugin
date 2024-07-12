# serverless-lodash-plugin

This module was born out of sheer frustration: while building a Serverless Framework project, I just wanted a convenient way to set `provisionedConcurrency` conditionally to `1` or `0`.

Easy, right?

Unfortunately...

- I needed to deliver that value as an environment variable.
- Environment variables are ONLY delivered into `serverless.yml` as strings.
- `provisionedConcurrency` HAS to be a number.

Bollocks. And while `serverless.yml` DOES support a few inline functions (like [`strToBool`](https://www.serverless.com/framework/docs/guides/variables#read-string-variable-values-as-boolean-values)), it won't parse an integer from a string. **P.S. Also, `strToBool` doesn't seem to work very well.** 🙄 Use `boolean` as described below instead!

Double bollocks. You can see other devs crying about the same problem [here](https://forum.serverless.com/t/problems-reading-in-integer-or-null-from-env-file-trying-to-disabled-or-set-provision-concurrency-for-development-or-production-stage/12956) and [here](https://github.com/serverless/serverless/issues/10791).

Hence this plugin, which exposes the entire [`lodash`](https://lodash.com/) library (plus some other goodies) as variables in `serverless.yml`.

I mean why use a fly swatter when you can use a bazooka, right? 🤓

## Why is this even an issue?

If you think about it, the Serverless Framework applies two independent processing layers to `serverless.yml`:

1. It parses the file into JSON, applies Serverless-specific variable expansion, and validates the result against its config schema.

1. It passes the result to provider-specific packaging logic (like AWS CloudFormation), which does its own provider-specific thing.

So if you try to use an AWS `!If` function to deal with the `provisionedConcurrency`-as-string issue, you're going to fail, because the environment variable containing the number will parse as a string and fail the first schema-validation step BEFORE your `!If` function gets a chance at it!

This plugin works because is functions run during the initial variable-expansion phase, BEFORE your config is validated against the Serverless schema. So as long as your `lodash` functions resolve to a valid `serverless.yml` config, you're good to go!

## Sign me up!

Thought so. 🤣 Install the plugin with:

```bash
npm i -D @karmaniverous/serverless-lodash-plugin
```

In general, use it like this in your `serverless.yml` file:

```yml
plugins:
  - '@karmaniverous/serverless-lodash-plugin'

someKey: ${lodash(<param1>, <param2>, ...):<functionName>}
# Equivalent to _.<functionName>(<param1>, <param2>, ...)
```

`<functionName>` can be:

- `boolean` (convert [lots of things](https://www.npmjs.com/package/boolean) to a boolean)
- `ifelse` (ternary function)
- `params` (converts params to an array)
- Any [lodash function](https://lodash.com/docs/4.17.15).

See below for examples.

`<param1>`, `<param2>`, etc. can be just about anything. [Raise an issue](https://github.com/karmaniverous/serverless-lodash-plugin/issues) if you figure out how to break it!

Yes, putting the function name after the params is a little weird. But Serverless parses the stuff in the parentheses as an array, so internally it makes sense. And [all the usual rules](https://www.serverless.com/framework/docs/guides/variables) apply with respect to Serverless variable parsing.

## Some examples

```yml
plugins:
  - '@karmaniverous/serverless-lodash-plugin'

iWantANumber: ${lodash(1, 2, 3):sum} # 6
# Equivalent to _.sum([1, 2, 3])

# Assuming env var THREE = '3'
meToo: ${_(1, 2, ${_(${env:THREE})parseInt}):sum} # 6
# Equivalent to _.sum([1, 2, parseInt(process.env.THREE)])

# The 'params' function converts the params into an array.
# You can pass a lodash function as a param, but only one level deep!
# Each expression & sub-expression has to returns a VALUE, not a FUNCTION.
iWantAnArray: ${lodash(${lodash(1, 2, 3):params}, _.multiply):map} # [0, 2, 6]
# Equivalent to _.map([1, 2, 3], _.multiply)

# AT LAST!
# boolean converts lots of things to a boolean.
# ifelse is a ternary function.
provisionedConcurrency: ${lodash(${lodash(${env:USE_PROVISIONED_CONCURRENCY}):boolean}, 1, 0):ifelse}
# Equivalent to boolean(process.env.USE_PROVISIONED_CONCURRENCY) ? 1 : 0
```

That's it. Go nuts!

---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
