import { DendronError } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
import { Logger } from "../logger";

export type CodeCommandConstructor = {
  key: string;
  new (): CodeCommandInstance;
};
export type CodeCommandInstance = {
  run: (opts?: any) => Promise<void>;
};

/**
 * Generics:
 *   - TOpts: passed into {@link BaseCommand.execute}
 *   - TGatherOutput: returned by {@link Basecommand.gatherInput}
 *   - TOut: returned by {@link BaseCommand.execute}
 *   - TRunOpts: returned by command
 */
export abstract class BaseCommand<
  TOpts,
  TOut = any,
  TGatherOutput = TOpts,
  TRunOpts = TOpts
> {
  public L: DLogger;

  constructor(_name?: string) {
    this.L = Logger;
  }

  static showInput = window.showInputBox;

  async gatherInputs(_opts?: TRunOpts): Promise<TGatherOutput | undefined> {
    return {} as any;
  }

  abstract enrichInputs(inputs: TGatherOutput): Promise<TOpts | undefined>;

  abstract execute(opts: TOpts): Promise<TOut>;

  async showResponse(_resp: TOut) {
    return;
  }

  /**
   * Basic error checking
   * @returns
   */
  async sanityCheck(): Promise<undefined | string | "cancel"> {
    return;
  }

  async run(args?: Partial<TRunOpts>): Promise<TOut | undefined> {
    // @ts-ignore
    const ctx = `${this.__proto__.constructor.name}:run`;
    try {
      const out = await this.sanityCheck();
      if (out === "cancel") {
        return;
      }
      if (!_.isUndefined(out) && out !== "cancel") {
        window.showErrorMessage(out);
        return;
      }

      // @ts-ignore
      const inputs = await this.gatherInputs(args);
      if (!_.isUndefined(inputs)) {
        const opts: TOpts | undefined = await this.enrichInputs(inputs);
        if (_.isUndefined(opts)) {
          return;
        }
        this.L.info({ ctx, msg: "pre-execute" });
        const resp = await this.execute({ ...opts, ...args });
        this.L.info({ ctx, msg: "post-execute" });
        this.showResponse(resp);
        return resp;
      }
      return;
    } catch (error) {
      let cerror: DendronError =
        error instanceof DendronError
          ? error
          : new DendronError({
              message: `error running command: ${error.message}`,
              payload: { error },
            });
      Logger.error({
        ctx,
        error: cerror,
      });
      return;
    }
  }
}

/**
 * Command with no enriched inputs
 */
export abstract class BasicCommand<
  TOpts,
  TOut = any,
  TRunOpts = TOpts
> extends BaseCommand<TOpts, TOut, TOpts, TRunOpts> {
  async enrichInputs(inputs: TOpts): Promise<TOpts> {
    return inputs;
  }
}
