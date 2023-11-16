import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { deepCopy } from "ethers/lib/utils";
import { SupportedInterfaceChain, CHAIN_IDS_TO_NAMES } from "utils/chain";

export default class AppStaticJsonRpcProvider extends StaticJsonRpcProvider {
  private _blockCache = new Map<string, Promise<any>>();
  get blockCache() {
    if (!this._blockCache.size) {
      this.once("block", () => this._blockCache.clear());
    }
    return this._blockCache;
  }

  constructor(chainId: SupportedInterfaceChain, url: string) {
    super(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] });
  }

  send(method: string, params: Array<any>): Promise<any> {
    // Only cache eth_call's.
    if (method !== "eth_call") return super.send(method, params);

    const key = `call:${JSON.stringify(params)}`;
    const cached = this.blockCache.get(key);
    if (cached) {
      this.emit("debug", {
        action: "request",
        request: deepCopy({ method, params, id: "cache" }),
        provider: this,
      });
      return cached;
    }

    const result = super.send(method, params);
    this.blockCache.set(key, result);
    return result;
  }
}
