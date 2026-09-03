'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Phone, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl text-soot font-normal mb-3 font-serif-display">
          Contact Us
        </h1>
        <p className="text-moss text-base sm:text-lg">
          We're here to help answer your questions about workspace bookings, company passes, or partnership opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Contact Info Cards (Flex Column to Match Height) */}
        <div className="flex flex-col gap-4">
          {/* Card 1: General Inquiries */}
          <div
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-6 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-eucalyptus/20 text-soot flex items-center justify-center shrink-0">
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-1 font-serif-display leading-snug">
                General Inquiries
              </h2>
              <p className="text-xs text-moss leading-relaxed">
                Questions about workspace memberships, day passes, or custom team plans.
              </p>
            </div>
          </div>

          {/* Card 2: Email Us */}
          <a
            href="mailto:info@coworkingpass.sa"
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-6 shadow-xs flex items-center gap-4 transition-all duration-200 group active:scale-[0.98] cursor-pointer hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-mist-light text-soot flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-0.5 font-serif-display leading-snug">
                Email Us
              </h2>
              <p className="text-sm font-medium text-soot">info@coworkingpass.sa</p>
              <p className="text-xs text-moss mt-1">Our support team responds within 24 hours.</p>
            </div>
          </a>

          {/* Card 3: Call Support */}
          <a
            href="tel:+966500000000"
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-6 shadow-xs flex items-center gap-4 transition-all duration-200 group active:scale-[0.98] cursor-pointer hover:shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-0.5 font-serif-display leading-snug">
                Call Support
              </h2>
              <p className="text-sm font-medium text-soot" dir="ltr">+966 50 000 0000</p>
              <p className="text-xs text-moss mt-1">Sun - Thu: 9:00 AM - 6:00 PM AST</p>
            </div>
          </a>
        </div>

        {/* Contact Form */}
        <div
          style={{
            backgroundColor: 'var(--plaster-surface, #FFFFFF)',
            borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
          }}
          className="lg:col-span-2 rounded-3xl border p-6 sm:p-8 shadow-md flex flex-col justify-between"
        >
          {submitted ? (
            <div className="text-center py-12 space-y-4 my-auto">
              <div
                style={{ backgroundColor: 'var(--eucalyptus, #98AA9D)' }}
                className="w-16 h-16 rounded-full bg-opacity-20 mx-auto flex items-center justify-center"
              >
                <CheckCircle2 size={36} style={{ color: 'var(--soot, #2D3536)' }} />
              </div>
              <h2 className="text-2xl text-soot font-normal font-serif-display">Message Sent!</h2>
              <p className="text-moss text-sm max-w-md mx-auto leading-relaxed">
                Thank you for reaching out, {name}. Our team has received your message and will get back to you at {email} shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl border border-soot/20 text-soot text-sm font-semibold hover:bg-soot hover:text-white transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-normal text-soot mb-4 font-serif-display">Send us a message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Mohammed Al-Faisal"
                    required
                    style={{
                      backgroundColor: 'var(--plaster-dark, #F9F8F5)',
                      borderColor: 'var(--border, rgba(45, 53, 54, 0.15))',
                    }}
                    className="w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    style={{
                      backgroundColor: 'var(--plaster-dark, #F9F8F5)',
                      borderColor: 'var(--border, rgba(45, 53, 54, 0.15))',
                    }}
                    className="w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="How can we help you?"
                  required
                  style={{
                    backgroundColor: 'var(--plaster-dark, #F9F8F5)',
                    borderColor: 'var(--border, rgba(45, 53, 54, 0.15))',
                  }}
                  className="w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Message *
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Provide details about your inquiry..."
                  required
                  style={{
                    backgroundColor: 'var(--plaster-dark, #F9F8F5)',
                    borderColor: 'var(--border, rgba(45, 53, 54, 0.15))',
                  }}
                  className="w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus/40 transition-all shadow-xs resize-y"
                />
              </div>

              {/* Form Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-moss hover:bg-soot text-white font-semibold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="text-white">Send Message</span>
                  <Send size={15} className="text-white" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
