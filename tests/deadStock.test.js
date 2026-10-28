import test from "node:test";
import assert from "node:assert/strict";
import { DEAD_STOCK_THRESHOLD_DAYS, getDeadStock } from "../src/deadStock.js";

const now = new Date("2026-10-28T12:00:00Z").getTime();
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);
const products = [
  { id: "biscuits", name: "Biscuits", stock: 30, unit: "packets" },
  { id: "rice", name: "Rice", stock: 12, unit: "bags" },
  { id: "milk", name: "Milk", stock: 0, unit: "packets" },
];

test("marks received stock as dead after 30 days when it has not sold", () => {
  const result = getDeadStock(products, [
    { type: "received", createdAt: daysAgo(31), items: [{ name: "Biscuits", quantity: 30 }] },
  ], now);

  assert.equal(DEAD_STOCK_THRESHOLD_DAYS, 30);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Biscuits");
  assert.equal(result[0].daysInactive, 31);
  assert.equal(result[0].inactiveSinceType, "received");
});

test("resets the unsold period after the most recent sale or restock", () => {
  const result = getDeadStock(products, [
    { type: "received", createdAt: daysAgo(90), items: [{ name: "Biscuits", quantity: 30 }] },
    { type: "sold", createdAt: daysAgo(60), items: [{ name: "Biscuits", quantity: 2 }] },
    { type: "received", createdAt: daysAgo(10), items: [{ name: "Rice", quantity: 12 }] },
  ], now);

  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Biscuits");
  assert.equal(result[0].inactiveSinceType, "sold");
});

test("does not include recently moved, depleted, or untracked starter stock", () => {
  const result = getDeadStock(products, [
    { type: "received", createdAt: daysAgo(29), items: [{ name: "Biscuits", quantity: 30 }] },
    { type: "received", createdAt: daysAgo(60), items: [{ name: "Milk", quantity: 30 }] },
  ], now);

  assert.deepEqual(result, []);
});
