import { HDNodeWallet } from "ethers";

export type UserEntity = {
  name: string;
  accounts: HDNodeWallet[];
};
