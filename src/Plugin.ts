import _ from 'lodash';
import Serverless from 'serverless';

interface ResolveInput {
  address: string;
  params?: unknown[];
}

interface ResolveOutput {
  value: unknown;
}

type ResolveFunction = (
  input: ResolveInput,
) => ResolveOutput | Promise<ResolveOutput>;

export class Plugin {
  configurationVariablesSources: Record<string, { resolve: ResolveFunction }>;

  constructor(private serverless: Serverless) {
    this.configurationVariablesSources = {
      lodash: { resolve: this.resolveLodash.bind(this) },
    };
  }

  private resolveLodash({ address, params = [] }: ResolveInput) {
    console.info({ address, params });

    params = params.map((param) => {
      if (!_.isString(param)) return param;

      const [, method] = param.match(/^_\.(\w+)$/) ?? [];

      // @ts-expect-error - unable to characterize params with dynamic method name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (method && method in _) return _[method];
      else return param;
    });

    const value =
      // @ts-expect-error - unable to characterize params with dynamic method name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      address === 'params' ? params : (_[address](...params) as unknown);

    // console.log({ address, params, value });

    return { value };
  }
}
