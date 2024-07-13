import { expect } from 'chai';
import { $ as $$ } from 'execa';
import fs from 'fs-extra';
import _ from 'lodash';
import { resolve } from 'path';
import { packageDirectory } from 'pkg-dir';
import yaml from 'yaml';

// set cwd
const cwd = resolve((await packageDirectory()) ?? './', 'test/');

// config execa instance
const $ = $$({ cwd });

// write config to serverless directory
const writeConfig = async (config: unknown) => {
  await fs.writeFile(
    resolve(cwd, 'serverless/serverless.yml'),
    yaml.stringify(config),
  );
};

// load packaged stack from serverless directory
const loadPackage = async () =>
  JSON.parse(
    await fs.readFile(
      resolve(
        cwd,
        'serverless/.serverless/cloudformation-template-update-stack.json',
      ),
      'utf8',
    ),
  ) as unknown;

describe('Plugin', function () {
  let config: unknown;

  before(async function () {
    config = await yaml.parse(
      await fs.readFile(resolve(cwd, 'serverless.yml'), 'utf8'),
    );
  });

  it('base config', async function () {
    await writeConfig(config);
    await $`npx serverless package`;
    const pkg = await loadPackage();

    expect(
      _.get(pkg, 'Resources.FooLambdaFunction.Properties.FunctionName'),
    ).to.equal('foo');
  });
});
