const { requireIntegration } = require("../config/integrations");

const sendEmail = async ({ to, subject, html }) => {
  requireIntegration("notifications");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html })
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}`);
  }

  return response.json();
};

const sendOrderConfirmation = async ({ email, order }) => sendEmail({
  to: email,
  subject: `ShopEase order ${order.id} confirmed`,
  html: `<h2>Thanks for your order</h2><p>Your payment was confirmed and your order is being prepared.</p><p><strong>Order:</strong> ${order.id}</p><p><strong>Total:</strong> ${order.total}</p>`
});

module.exports = { sendEmail, sendOrderConfirmation };
