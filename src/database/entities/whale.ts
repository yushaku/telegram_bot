import mongoose from "mongoose";

export const TokenSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  decimals: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

export const TrasactionSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    default: "BUY",
  },
  address: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const WhaleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    pnl: {
      type: Number,
      default: null,
    },
    currentBlock: {
      type: Number,
      default: null,
    },
    tokenHoldings: {
      type: [TokenSchema],
      default: {},
    },
    history: {
      type: [TrasactionSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

export const WhaleModel = mongoose.model("Whale", WhaleSchema);
