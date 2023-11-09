export interface Account {
  privateKey: string;
  mnemonic: string;
  address: string;
}

export type UserEntity = {
  name: string;
  accounts: Account[];
};
