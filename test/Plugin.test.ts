import { expect } from 'chai';
import { $ as $$ } from 'execa';
import fs from 'fs-extra';
import _ from 'lodash';
import { resolve } from 'path';
import { packageDirectory } from 'pkg-dir';
import yaml from 'yaml';

// set cwd
const cwd = resolve((await packageDirectory()) ?? './', 'test/serverless');

// config execa instance
const $ = $$({ cwd, env: { LOG_LEVEL: 'debug' }, stdio: 'inherit' });

// write config to serverless directory
const writeConfig = async (config: unknown) => {
  await fs.writeFile(resolve(cwd, 'serverless.yml'), yaml.stringify(config));
};

// load packaged stack from serverless directory
const loadPackage = async () =>
  JSON.parse(
    await fs.readFile(
      resolve(cwd, '.serverless/cloudformation-template-update-stack.json'),
      'utf8',
    ),
  ) as unknown;

describe('Plugin', function () {
  let config: object;

  before(async function () {
    config = (await yaml.parse(
      await fs.readFile(resolve(cwd, '../serverless.yml'), 'utf8'),
    )) as object;
  });

  it('base', async function () {
    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(pkg, 'Resources.FooLambdaFunction.Properties.FunctionName'),
    ).to.equal('foo');
  });

  it('static pc on', async function () {
    _.set(config, 'functions.foo.provisionedConcurrency', 1);

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooProvConcLambdaAlias.Properties.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions',
      ),
    ).to.equal(1);
  });

  it('static pc off', async function () {
    _.set(config, 'functions.foo.provisionedConcurrency', 0);

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooProvConcLambdaAlias.Properties.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions',
      ),
    ).not.to.exist;
  });

  it('lodash env', async function () {
    process.env.FOO = 'bar';

    _.set(
      config,
      'functions.foo.environment.FOO',
      '${lodash(${env:FOO}):toUpper}',
    );

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooLambdaFunction.Properties.Environment.Variables.FOO',
      ),
    ).to.equal('BAR');
  });

  it('lodash pc on', async function () {
    process.env.USE_PROVISIONED_CONCURRENCY = 'true';

    _.set(
      config,
      'functions.foo.provisionedConcurrency',
      '${lodash(${lodash(${env:USE_PROVISIONED_CONCURRENCY}):boolean}, 1, 0):ifelse, 0}',
    );

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooProvConcLambdaAlias.Properties.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions',
      ),
    ).to.equal(1);
  });

  it('lodash pc off weirdness', async function () {
    process.env.USE_PROVISIONED_CONCURRENCY = 'false';

    _.set(
      config,
      'functions.foo.provisionedConcurrency',
      '${lodash(${lodash(${env:USE_PROVISIONED_CONCURRENCY}):boolean}, 1, 0):ifelse, 0}',
    );

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooProvConcLambdaAlias.Properties.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions',
      ),
    ).not.to.exist;
  });

  it('lodash pc off reduced', async function () {
    process.env.USE_PROVISIONED_CONCURRENCY = 'false';

    _.set(
      config,
      'functions.foo.provisionedConcurrency',
      '${lodash(${lodash(${env:USE_PROVISIONED_CONCURRENCY}):boolean}, 1):ifelse, 0}',
    );

    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(
        pkg,
        'Resources.FooProvConcLambdaAlias.Properties.ProvisionedConcurrencyConfig.ProvisionedConcurrentExecutions',
      ),
    ).not.to.exist;
  });
});
