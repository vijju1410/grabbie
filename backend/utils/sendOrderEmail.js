const nodemailer = require("nodemailer");

const sendOrderEmail = async (userEmail, order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = order.products.map(p => {
      return `
        <tr>
          <td>${p.productId.name}</td>
          <td>${p.quantity}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <div style="font-family: Arial; padding:20px">
        <h2 style="color:#16a34a;">✅ Order Confirmed!</h2>
        
        <p>Hi ${order.deliveryDetails.fullName},</p>
        <p>Your order has been successfully placed 🎉</p>

        <h3>📦 Order Details</h3>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>Total:</b> ₹${order.totalAmount}</p>

        <h3>🛍 Items</h3>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <th>Product</th>
            <th>Qty</th>
          </tr>
          ${itemsHtml}
        </table>

        <h3>🚚 Delivery Address</h3>
        <p>
          ${order.deliveryDetails.addressLine1},<br/>
          ${order.deliveryDetails.city}, ${order.deliveryDetails.state}
        </p>

        <p style="margin-top:20px">
          ⏱ Expected delivery: 30–60 minutes
        </p>

        <hr/>

        <p>Thank you for choosing <b>Grabbie</b> ❤️</p>
      </div>
    `;

    await transporter.sendMail({
      to: userEmail,
      subject: "🛒 Your Order is Confirmed - Grabbie",
      html,
    });

  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

module.exports = sendOrderEmail;