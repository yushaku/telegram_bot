import mongoose from "mongoose";

export const WatchlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
});

export const AccountSchema = new mongoose.Schema({
  privateKey: { type: String, required: true },
  address: { type: String, required: true },
  mnemonic: { type: String, required: false, default: null },
});

export const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    accounts: {
      type: [AccountSchema],
      default: [],
    },
    watchList: {
      type: [WatchlistSchema],
      default: [],
    },
    mainAccount: {
      type: AccountSchema,
    },
    slippage: {
      type: Number,
      default: 1,
    },
    maxGas: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

export const UserModel = mongoose.model("User", UserSchema);
