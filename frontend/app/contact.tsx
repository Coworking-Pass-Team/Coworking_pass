'use client';
import { MessageCircle, Mail, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold text-soot mb-3" style={{ fontFamily: 'DM Serif Display, serif' }}>
          تواصل معنا
        </h1>
        <p className="text-moss text-base">نحن هنا لمساعدتك في أي وقت</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-soot/8 bg-plaster p-7 flex flex-col gap-4">
          <div className="w-11 h-11 rounded-xl bg-eucalyptus flex items-center justify-center">
            <MessageCircle size={20} className="text-soot" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-soot mb-1.5">استفسار عام</h2>
            <p className="text-sm text-moss leading-relaxed">
              يسعدنا تواصلك معنا لأي استفسار حول المساحات أو الاشتراكات.
            </p>
          </div>
        </div>

        <a href="mailto:info@coworkingpass.sa" className="rounded-2xl border border-soot/8 bg-plaster p-7 flex flex-col gap-4 transition-colors hover:bg-mist/20">
          <div className="w-11 h-11 rounded-xl bg-mist flex items-center justify-center">
            <Mail size={20} className="text-soot" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-soot mb-1.5">البريد الإلكتروني</h2>
            <p className="text-sm text-moss leading-relaxed" dir="ltr">info@coworkingpass.sa</p>
          </div>
        </a>

        <a href="tel:+966500000000" className="rounded-2xl border border-soot/8 bg-plaster p-7 flex flex-col gap-4 transition-colors hover:bg-moss/10">
          <div className="w-11 h-11 rounded-xl bg-moss flex items-center justify-center">
            <Phone size={20} className="text-plaster" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-soot mb-1.5">الهاتف</h2>
            <p className="text-sm text-moss leading-relaxed" dir="ltr">+966 50 000 0000</p>
          </div>
        </a>
      </div>
    </div>
  );
}