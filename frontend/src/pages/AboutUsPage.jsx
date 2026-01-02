import React from "react";
import { motion } from "framer-motion";
import { Truck, Store, Users, Phone, Mail, Target, HeartHandshake } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const AboutUsPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-28">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            About <span className="text-yellow-300">Grabbie</span>
          </h1>
          <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
            Grabbie is a hyperlocal delivery platform designed to connect local
            vendors, restaurants, and stores with nearby customers — fast,
            simple, and reliable.
          </p>
        </div>
      </section>

      {/* ================= WHY GRABBIE ================= */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-4xl font-extrabold text-center mb-16"
        >
          Why <span className="text-orange-600">Grabbie</span>?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              icon: Target,
              title: "Local First",
              text: "We prioritize local shops and vendors, helping them grow digitally and reach nearby customers."
            },
            {
              icon: Truck,
              title: "Fast Delivery",
              text: "Orders are delivered quickly through optimized workflows and dedicated delivery partners."
            },
            {
              icon: HeartHandshake,
              title: "Trusted Platform",
              text: "Transparent pricing, verified vendors, and secure authentication for all users."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition"
            >
              <item.icon className="w-14 h-14 text-orange-600 mb-6" />
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= MISSION & VISION ================= */}
      <section className="py-24 bg-orange-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl p-12">
            <h2 className="text-3xl font-bold text-orange-600 mb-4">🎯 Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To empower local businesses and provide customers with fast,
              affordable access to everyday products and food using technology.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl p-12">
            <h2 className="text-3xl font-bold text-orange-600 mb-4">🌍 Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To build a digitally connected ecosystem where local commerce
              thrives alongside modern convenience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-4xl font-extrabold mb-16">
            How <span className="text-orange-600">Grabbie</span> Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Store, title: "Vendors List Products", text: "Local vendors add products, menus, and deals." },
              { icon: Users, title: "Customers Order", text: "Customers browse nearby stores and place orders instantly." },
              { icon: Truck, title: "Drivers Deliver", text: "Delivery partners pick up and deliver orders efficiently." }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="p-10 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition">
                <item.icon className="w-14 h-14 text-orange-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOUNDER ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-4xl font-extrabold mb-12">
            👨‍💻 About the Founder
          </motion.h2>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="bg-gray-50 rounded-3xl p-10 shadow-xl">
            <img
              src="/images/vijay.png"
              alt="Vijay Prajapati"
              className="w-36 h-36 mx-auto rounded-full object-cover border-4 border-orange-500 mb-6"
            />
            <h3 className="text-2xl font-bold">Vijay Prajapati</h3>
            <p className="text-orange-600 font-medium mb-4">
              Founder & Full Stack Developer
            </p>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
              I independently designed and developed Grabbie as a full-stack
              project, focusing on real-world architecture, role-based access,
              secure authentication, and scalable UI/UX.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section className="py-24 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-extrabold mb-6">📞 Contact</h2>
          <p className="text-orange-100 mb-12 text-lg">
            Questions, suggestions, or collaboration ideas? Let’s connect.
          </p>
    <div className="flex flex-col md:flex-row justify-center gap-8">

  {/* CALL */}
  <a
    href="tel:+917490983889"
    className="flex items-center bg-white text-gray-800 rounded-xl px-8 py-5 shadow-lg hover:scale-105 transition"
  >
    <Phone className="w-6 h-6 text-orange-600 mr-3" />
    <span>+91 74909 83889</span>
  </a>
  {/* PORTFOLIO */}
  <a
    href="https://prajapativijay.netlify.app/"
    target="_blank"
    rel="noreferrer"
    className="flex items-center bg-white text-gray-800 rounded-xl px-8 py-5 shadow-lg hover:scale-105 transition"
  >
    <span className="text-orange-600 mr-3 text-xl">🌐</span>
    <span>My Portfolio</span>
  </a>

  {/* EMAIL */}
  <a
    href="https://mail.google.com/mail/?view=cm&fs=1&to=vijayprajapati1410@gmail.com"
    target="_blank"
    rel="noreferrer"
    className="flex items-center bg-white text-gray-800 rounded-xl px-8 py-5 shadow-lg hover:scale-105 transition"
  >
    <Mail className="w-6 h-6 text-orange-600 mr-3" />
    <span>vijayprajapati1410@gmail.com</span>
  </a>

</div>


        </motion.div>
      </section>

    </div>
  );
};

export default AboutUsPage;
