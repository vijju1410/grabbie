const PDFDocument = require("pdfkit");

const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const charges = order.charges || {};
      const safeId = order._id.toString().slice(-6);

      /* ================= HEADER ================= */
      doc.rect(0, 0, 612, 80).fill("#16a34a");

      doc.fillColor("white").fontSize(22).text("GRABBIE", 40, 25);
      doc.fontSize(10).text("Grab local deals, delivered quick", 40, 55);

      doc.fillColor("black").moveDown(4);

      /* ================= INVOICE INFO ================= */
      doc.fontSize(10);
      doc.text(`Invoice No: INV-${safeId}`);
      doc.text(`Order ID: ${order._id}`);
      doc.text(`Order Date: ${new Date(order.createdAt).toDateString()}`);
      doc.moveDown();

      /* ================= CUSTOMER ================= */
      doc.fontSize(12).text("Bill To:", { underline: true });
      doc.fontSize(10);
      doc.text(order.deliveryDetails?.fullName || "");
      doc.text(order.deliveryDetails?.email || "");
      doc.text(
        `${order.deliveryDetails?.addressLine1 || ""}, ${order.deliveryDetails?.city || ""}, ${order.deliveryDetails?.state || ""} - ${order.deliveryDetails?.postalCode || ""}`
      );
      doc.moveDown();

      /* ================= ITEMS TABLE ================= */
      doc.fontSize(12).text("Order Items", { underline: true });
      doc.moveDown(0.5);

      doc.font("Helvetica-Bold").fontSize(10);

      doc.text("Item", 40, doc.y, { width: 220 });
      doc.text("Qty", 280, doc.y, { width: 60, align: "center" });
      doc.text("Price", 360, doc.y, { width: 80, align: "right" });
      doc.text("Total", 460, doc.y, { width: 80, align: "right" });

      doc.moveDown(0.4);
      doc.moveTo(40, doc.y).lineTo(540, doc.y).stroke();

      doc.font("Helvetica");

      let y = doc.y + 6;

      order.products.forEach((item) => {
        const name = item.productId?.name || "Product";

        // 🔥 NEW (USE DISCOUNT DATA)
        const original = item.price || item.productId?.price || 0;
        const final = item.finalPrice || original;
        const discount = item.discount || 0;
        const qty = item.quantity || 1;

        const total = final * qty;

        doc.text(name, 40, y, { width: 220 });
        doc.text(qty.toString(), 280, y, { width: 60, align: "center" });

        // 🔥 ORIGINAL PRICE (STRIKE)
        if (discount > 0) {
          doc
            .fillColor("#9ca3af")
            .text(`₹${original.toFixed(2)}`, 360, y, {
              width: 80,
              align: "right",
            });
        } else {
          doc.text(`₹${original.toFixed(2)}`, 360, y, {
            width: 80,
            align: "right",
          });
        }

        // 🔥 FINAL PRICE
        doc
          .fillColor("black")
          .text(`₹${total.toFixed(2)}`, 460, y, {
            width: 80,
            align: "right",
          });

        // 🔥 DISCOUNT LINE
        if (discount > 0) {
          y += 15;
          doc
            .fillColor("green")
            .fontSize(9)
            .text(`₹${discount.toFixed(2)} OFF`, 40, y);

          doc.fillColor("black").fontSize(10);
        }

        y += 25;
      });

      doc.moveDown(2);

      /* ================= SAVINGS (NEW) ================= */
      const totalSavings = order.products.reduce((sum, item) => {
        return sum + (item.discount || 0) * (item.quantity || 1);
      }, 0);

      if (totalSavings > 0) {
        doc
          .fillColor("green")
          .fontSize(11)
          .text(`🎉 You saved ₹${totalSavings.toFixed(2)} on this order!`);

        doc.fillColor("black");
      }

      /* ================= CHARGES ================= */
      const boxY = doc.y;

      doc.rect(330, boxY, 240, 160).stroke();

      const row = (label, value, offset) => {
        doc.text(label, 340, boxY + offset);
        doc.text(`₹${Number(value || 0).toFixed(2)}`, 470, boxY + offset, {
          align: "right",
        });
      };

      row("Items Subtotal:", charges.itemsTotal, 12);
      row("Service Charge:", charges.serviceCharge, 35);
      row("GST:", charges.gst, 58);
      row("Platform Fee:", charges.platformFee, 81);
      row("Delivery Charge:", charges.deliveryCharge, 104);

      /* ================= TOTAL ================= */
      doc.rect(330, boxY + 125, 240, 45).fill("#dcfce7");

      doc
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("Grand Total:", 345, boxY + 140);

      doc.text(
        `₹${Number(charges.grandTotal || order.totalAmount).toFixed(2)}`,
        470,
        boxY + 140,
        { align: "right" }
      );

      /* ================= FOOTER ================= */
      doc.moveDown(4).fontSize(9).text(
        "This is a system generated invoice. No signature required.",
        { align: "center" }
      );

      doc.moveDown(2);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#166534")
        .text("Thank you for shopping with us!", {
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoicePDF;