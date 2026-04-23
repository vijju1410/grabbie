const nodemailer = require("nodemailer");
const generateInvoicePDF = require("./generateInvoicePDF");

const sendOrderEmail = async (userEmail, order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🎯 Generate PDF
    const pdfBuffer = await generateInvoicePDF(order);

    // 🎨 PROFESSIONAL HTML (Swiggy style)
    const html = `
      <div style="font-family: Arial; background:#f9fafb; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
          
          <div style="background:#16a34a; color:white; padding:20px;">
            <h2>🛒 Order Confirmed</h2>
            <p>Thanks for ordering with Grabbie!</p>
          </div>

          <div style="padding:20px;">
            <p>Hi <b>${order.deliveryDetails?.fullName || "Customer"}</b>,</p>
            <p>Your order has been successfully placed 🎉</p>

            <div style="background:#f0fdf4; padding:15px; border-radius:8px; margin:15px 0;">
              <p><b>Order ID:</b> ${order._id}</p>
              <p><b>Total:</b> ₹${Number(order.totalAmount || 0).toFixed(2)}</p>
              <p><b>Payment:</b> ${order.paymentMethod || "N/A"}</p>
            </div>

            <h3>📦 Items</h3>

            <table style="width:100%; border-collapse: collapse; margin-top:10px;">
              <tr style="background:#f3f4f6;">
                <th style="padding:8px; text-align:left;">Item</th>
                <th style="padding:8px; text-align:center;">Qty</th>
              </tr>

              ${(order.products || []).map(p => `
                <tr>
                  <td style="padding:8px;">
                    ${p.productId?.name || "Product"}
                  </td>
                  <td style="padding:8px; text-align:center;">
                    ${p.quantity || 1}
                  </td>
                </tr>
              `).join("")}
            </table>

            <h3 style="margin-top:20px;">💰 Price Details</h3>

            <div style="font-size:14px; color:#374151;">
              <p>Items: ₹${Number(order.charges?.itemsTotal || 0).toFixed(2)}</p>
              <p>GST: ₹${Number(order.charges?.gst || 0).toFixed(2)}</p>
              <p>Platform Fee: ₹${Number(order.charges?.platformFee || 0).toFixed(2)}</p>
              <p>Delivery: ₹${Number(order.charges?.deliveryCharge || 0).toFixed(2)}</p>
              <p><b>Total: ₹${Number(order.totalAmount || 0).toFixed(2)}</b></p>
            </div>

            <h3 style="margin-top:20px;">🚚 Delivery Address</h3>
            <p>
              ${order.deliveryDetails?.addressLine1 || ""},<br/>
              ${order.deliveryDetails?.city || ""}, ${order.deliveryDetails?.state || ""}
            </p>

            <div style="margin-top:20px; padding:15px; background:#fff7ed; border-radius:8px;">
              ⏱ Expected delivery: <b>30–60 mins</b>
            </div>

            <div style="text-align:center; margin-top:20px;">
              <a href="http://localhost:3000/orders"
                 style="background:#16a34a; color:white; padding:10px 20px; border-radius:6px; text-decoration:none;">
                 📦 Track Your Order
              </a>
            </div>

            <p style="margin-top:20px;">
              You can track your order in the app.
            </p>
          </div>

          <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:12px;">
            ❤️ Thank you for choosing Grabbie
          </div>

        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Grabbie" <${process.env.EMAIL}>`, // ✅ IMPORTANT FIX
      to: userEmail,
      subject: "🛒 Order Confirmed - Grabbie",
      html,

      // 📎 ATTACH PDF
      attachments: [
        {
          filename: `invoice-${order._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("✅ Email + Invoice sent");
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
};

module.exports = sendOrderEmail;