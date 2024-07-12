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
    params = params.map((param) => {
      if (!_.isString(param)) return param;

      const [, method] = param.match(/^_\.(\w+)$/) ?? [];

      // @ts-expect-error - unable to characterize params with dynamic method name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (method && method in _) return _[method];
      else return param;
    });

    const value = (() => {
      switch (address) {
        case 'params':
          return params;
        case 'ifelse':
          return params[0] ? params[1] : params[2];
        default:
          // @ts-expect-error - unable to characterize params with dynamic method name
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          if (address in _) return _[address](...params) as unknown;
          else throw new Error(`Unknown lodash method: ${address}`);
      }
    })();

    // console.log({ address, params, value });

    return { value };
  }
}
