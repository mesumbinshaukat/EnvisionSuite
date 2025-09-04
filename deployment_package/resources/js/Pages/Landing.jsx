import React, { useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import gsap from 'gsap';

export default function Landing() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (heroRef.current) {
      const heroEls = heroRef.current.querySelectorAll('.stagger');
      if (heroEls && heroEls.length) tl.from(heroEls, { opacity: 0, y: 40, duration: 0.8, stagger: 0.15 });
    }
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll('.card');
      if (cards && cards.length) tl.from(cards, { opacity: 0.999, y: 30, duration: 0.6, stagger: 0.1 }, '-=0.2');
    }
    if (ctaRef.current) {
      tl.from(ctaRef.current, { opacity: 0.999, y: 30, duration: 0.8 }, '-=0.2');
    }
    if (contactRef.current) {
      tl.from(contactRef.current, { opacity: 0.999, y: 20, duration: 0.6 }, '-=0.4');
    }
  }, []);

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <Head title="EnvisionSuite by Envision Xperts" />
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-400 to-blue-500" />
          <span className="font-semibold tracking-wide">Envision Xperts</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#reports" className="hover:text-white">Reports</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href={route('login')} className="px-4 py-2 text-sm text-white/80 hover:text-white">Log in</Link>
          <Link href={route('register')} className="px-4 py-2 text-sm rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-6 pt-10 pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="stagger text-4xl md:text-6xl font-extrabold leading-tight">
            Unified POS + Ledger<br />Built for Modern Retail
          </h1>
          <p className="stagger mt-5 text-lg text-slate-300">
            EnvisionSuite combines lightning-fast POS, advanced inventory, and powerful accounting
            into one elegant dashboard. Multi-shop. Role-based. Export-ready.
          </p>
          <div className="stagger mt-8 flex gap-4">
            <Link href={route('login')} className="px-6 py-3 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400">Launch Dashboard</Link>
            <a href="#features" className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15">Explore Features</a>
          </div>
          <div className="stagger mt-6 text-sm text-slate-400">
            Trusted by forward-thinking businesses. Seamlessly integrated with abivia/ledger.
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-emerald-500/20 to-blue-400/20 blur-2xl rounded-3xl" />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="h-72 md:h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">EnvisionSuite</div>
                <div className="mt-2 text-slate-400">POS · Inventory · Ledger · Reports</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featuresRef} className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-white">Why EnvisionSuite</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Multi-Shop Management', desc: 'Switch shops seamlessly. Shop-scoped data and reporting.' },
            { title: 'Advanced Inventory', desc: 'Stock movements, transfers, adjustments, and alerts.' },
            { title: 'POS Checkout', desc: 'Fast, reliable sales with taxes, discounts, and payments.' },
            { title: 'RBAC Security', desc: 'Roles for superadmin, admin, cashier, and accountant.' },
            { title: 'Excel Exports', desc: 'One-click XLSX exports for sales and inventory.' },
            { title: 'Insightful Charts', desc: 'Sales trends and stock visuals powered by Chart.js.' },
          ].map((f, i) => (
            <div key={i} className="card bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition">
              <div className="text-emerald-400 font-semibold">{f.title}</div>
              <div className="mt-2 text-sm text-slate-300">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Reports preview */}
      <section id="reports" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-slate-400">Sales Report</div>
            <div className="mt-2 text-2xl font-semibold">Realtime KPIs</div>
            <p className="mt-2 text-slate-300 text-sm">Track daily and monthly sales scoped to your shop and role.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-slate-400">Inventory Report</div>
            <div className="mt-2 text-2xl font-semibold">Stock at a glance</div>
            <p className="mt-2 text-slate-300 text-sm">Visualize stock levels and recent movements instantly.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} id="pricing" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-10 text-slate-900">
          <div className="text-3xl font-black">Ready to modernize your retail?</div>
          <div className="mt-2 text-slate-900/80">Start with EnvisionSuite today. Built by Envision Xperts.</div>
          <div className="mt-6 flex gap-4">
            <Link href={route('register')} className="px-6 py-3 bg-white rounded-lg font-semibold">Create Account</Link>
            <Link href={route('login')} className="px-6 py-3 bg-black/20 rounded-lg font-semibold">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" ref={contactRef} className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold">Contact Us</h3>
          <p className="text-slate-300 mt-2 text-sm">Have questions or need a demo? Send us a message.</p>
          <form action="mailto:support@envisionxperts.com" method="post" encType="text/plain" className="mt-6 grid md:grid-cols-2 gap-4">
            <input className="bg-slate-900 border border-white/10 rounded-lg px-4 py-3" placeholder="Your Name" name="name" required />
            <input className="bg-slate-900 border border-white/10 rounded-lg px-4 py-3" placeholder="Email" type="email" name="email" required />
            <input className="md:col-span-2 bg-slate-900 border border-white/10 rounded-lg px-4 py-3" placeholder="Subject" name="subject" />
            <textarea className="md:col-span-2 bg-slate-900 border border-white/10 rounded-lg px-4 py-3" placeholder="Message" name="message" rows={4} />
            <div className="md:col-span-2">
              <button type="submit" className="px-6 py-3 rounded-lg bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400">Send Message</button>
            </div>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Envision Xperts. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
