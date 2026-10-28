export const DEAD_STOCK_THRESHOLD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function timestampMillis(value) {
  const date = value?.toDate
    ? value.toDate()
    : value?.seconds
      ? new Date(value.seconds * 1000)
      : value instanceof Date
        ? value
        : value
          ? new Date(value)
          : null;
  const milliseconds = date?.getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

export function getDeadStock(products, activities, now = Date.now(), thresholdDays = DEAD_STOCK_THRESHOLD_DAYS) {
  const historyByProduct = new Map();

  for (const activity of activities) {
    const activityTime = timestampMillis(activity.createdAt);
    if (activityTime === null) continue;

    for (const item of activity.items || []) {
      const key = item.name?.trim().toLocaleLowerCase();
      if (!key) continue;

      const history = historyByProduct.get(key) || { lastSoldAt: null, lastReceivedAt: null };
      if (activity.type === "sold" || activity.type === "credit") {
        history.lastSoldAt = Math.max(history.lastSoldAt || 0, activityTime);
      } else if (activity.type === "received" || activity.type === "returned") {
        history.lastReceivedAt = Math.max(history.lastReceivedAt || 0, activityTime);
      }
      historyByProduct.set(key, history);
    }
  }

  return products
    .filter((product) => Number(product.stock) > 0)
    .flatMap((product) => {
      const history = historyByProduct.get(product.name?.trim().toLocaleLowerCase());
      if (!history) return [];

      const lastActivityAt = Math.max(history.lastSoldAt || 0, history.lastReceivedAt || 0);
      if (!lastActivityAt) return [];

      const daysInactive = Math.floor((now - lastActivityAt) / DAY_MS);
      if (daysInactive < thresholdDays) return [];

      return [{
        ...product,
        daysInactive,
        lastSoldAt: history.lastSoldAt,
        lastReceivedAt: history.lastReceivedAt,
        inactiveSince: lastActivityAt,
        inactiveSinceType: history.lastReceivedAt > (history.lastSoldAt || 0) ? "received" : "sold",
      }];
    })
    .sort((left, right) => right.daysInactive - left.daysInactive);
}
