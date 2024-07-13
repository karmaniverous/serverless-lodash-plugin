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
const $ = $$({ cwd });

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

  it('base config', async function () {
    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(pkg, 'Resources.FooLambdaFunction.Properties.FunctionName'),
    ).to.equal('foo');
  });

  it('provisionedConcurrency on (static)', async function () {
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

  it('provisionedConcurrency off (static)', async function () {
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
});
