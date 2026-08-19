const { requireIntegration } = require("../config/integrations");

const createShipment = async ({ orderId, address, items }) => {
  requireIntegration("shipping");
  const response = await fetch(`${process.env.SHIPPING_API_URL}/shipments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SHIPPING_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ orderId, address, items })
  });

  if (!response.ok) {
    throw new Error(`Shipping provider returned ${response.status}`);
  }

  return response.json();
};

const getTracking = async (trackingNumber) => {
  requireIntegration("shipping");
  const response = await fetch(`${process.env.SHIPPING_API_URL}/tracking/${encodeURIComponent(trackingNumber)}`, {
    headers: { Authorization: `Bearer ${process.env.SHIPPING_API_KEY}` }
  });

  if (!response.ok) {
    throw new Error(`Shipping provider returned ${response.status}`);
  }

  return response.json();
};

module.exports = { createShipment, getTracking };
