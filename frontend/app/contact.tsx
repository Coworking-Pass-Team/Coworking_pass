'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  X,
  Paperclip
} from 'lucide-react';

import { useApp } from '@/app/store';

type InquiryType = 'general' | 'complaint' | 'refund';

export default function Contact() {
  const { addSupportTicket, currentUser } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, image: 'File size must be less than 5MB' }));
        return;
      }
      setFileName(file.name);
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy.image;
        return copy;
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setFileName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (!message.trim()) errs.message = 'Message details are required';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    addSupportTicket({
      userName: name.trim(),
      userEmail: email.trim(),
      userId: currentUser?.id,
      category: inquiryType,
      subject: subject.trim(),
      message: message.trim(),
      attachedImage: attachedImage || undefined,
      attachedFileName: fileName || undefined,
      status: 'open',
    });

    setSubmitted(true);
  };

  const inquiryLabels: Record<InquiryType, { label: string; badgeColor: string }> = {
    general: { label: 'General Inquiry', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    complaint: { label: 'Complaint', badgeColor: 'bg-rose-100 text-rose-900 border-rose-300' },
    refund: { label: 'Refund Request', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      {/* Header Section */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl text-soot font-normal mb-3 font-serif-display">
          Contact Support Desk
        </h1>
        <p className="text-moss text-base sm:text-lg">
          Submit complaints, request booking refunds, or ask general questions. Our dedicated support team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Contact Info Cards (Aligned with Form Height) */}
        <div className="flex flex-col gap-4 h-full justify-between">
          {/* Card 1: Customer Support */}
          <div
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-5 sm:p-6 shadow-xs flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-eucalyptus/20 text-soot flex items-center justify-center shrink-0">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-1 font-serif-display leading-snug">
                Customer Support
              </h2>
              <p className="text-xs sm:text-sm text-moss leading-relaxed">
                Assistance with workspace bookings, complaints, and refund requests.
              </p>
            </div>
          </div>

          {/* Card 2: Email Support */}
          <a
            href="mailto:info@coworkingpass.sa"
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-5 sm:p-6 shadow-xs flex items-center gap-4 transition-all duration-200 group active:scale-[0.98] cursor-pointer hover:shadow-md hover:border-soot/25"
          >
            <div className="w-12 h-12 rounded-2xl bg-mist-light text-soot flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-0.5 font-serif-display leading-snug">
                Email Support
              </h2>
              <p className="text-sm font-semibold text-soot">info@coworkingpass.sa</p>
              <p className="text-xs text-moss mt-0.5">Response within 24 hours</p>
            </div>
          </a>

          {/* Card 3: Phone Support */}
          <a
            href="tel:+966500000000"
            style={{
              backgroundColor: 'var(--plaster-surface, #FFFFFF)',
              borderColor: 'var(--border, rgba(45, 53, 54, 0.12))',
            }}
            className="flex-1 rounded-3xl border p-5 sm:p-6 shadow-xs flex items-center gap-4 transition-all duration-200 group active:scale-[0.98] cursor-pointer hover:shadow-md hover:border-soot/25"
          >
            <div className="w-12 h-12 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot mb-0.5 font-serif-display leading-snug">
                Phone Support
              </h2>
              <p className="text-sm font-semibold text-soot dir-ltr" dir="ltr">+966 50 000 0000</p>
              <p className="text-xs text-moss mt-0.5">Sun – Thu: 9:00 AM – 6:00 PM AST</p>
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
              <h2 className="text-2xl text-soot font-normal font-serif-display">Ticket Submitted</h2>
              <p className="text-moss text-sm max-w-md mx-auto leading-relaxed">
                Thank you for reaching out, <strong className="text-soot">{name}</strong>. Your support ticket regarding <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${inquiryLabels[inquiryType].badgeColor}`}>{inquiryLabels[inquiryType].label}</span> has been logged. We will contact you at <strong className="text-soot">{email}</strong> shortly.
              </p>
              {attachedImage && (
                <div className="p-3 bg-plaster-dark/30 rounded-2xl border border-soot/10 max-w-xs mx-auto text-left flex items-center gap-3">
                  <img src={attachedImage} alt="Attachment" className="w-12 h-12 object-cover rounded-xl border border-soot/10" />
                  <div className="text-xs truncate">
                    <span className="font-semibold text-soot block truncate">{fileName}</span>
                    <span className="text-moss text-[11px]">Attached Screenshot</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setAttachedImage(null);
                  setFileName('');
                  setMessage('');
                  setSubject('');
                }}
                className="mt-4 px-6 py-2.5 rounded-xl border border-soot/20 text-soot text-sm font-semibold hover:bg-soot hover:text-white transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-normal text-soot font-serif-display">Submit a Support Request</h2>

              {/* Inquiry Type Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-2 uppercase tracking-wider">
                  Inquiry Topic <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInquiryType('general')}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      inquiryType === 'general'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-2xs ring-1 ring-emerald-600'
                        : 'border-soot/12 bg-plaster-dark/20 text-soot hover:bg-plaster-dark/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle size={16} className={inquiryType === 'general' ? 'text-emerald-700' : 'text-moss'} />
                      <span className="font-semibold text-xs sm:text-sm">General Inquiry</span>
                    </div>
                    <span className="text-[11px] text-moss leading-tight hidden sm:block">
                      Questions &amp; workspace info
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInquiryType('complaint')}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      inquiryType === 'complaint'
                        ? 'border-rose-600 bg-rose-50/70 text-rose-950 shadow-2xs ring-1 ring-rose-600'
                        : 'border-soot/12 bg-plaster-dark/20 text-soot hover:bg-plaster-dark/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={16} className={inquiryType === 'complaint' ? 'text-rose-700' : 'text-moss'} />
                      <span className="font-semibold text-xs sm:text-sm">File a Complaint</span>
                    </div>
                    <span className="text-[11px] text-moss leading-tight hidden sm:block">
                      Report space or service issue
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInquiryType('refund')}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      inquiryType === 'refund'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950 shadow-2xs ring-1 ring-amber-600'
                        : 'border-soot/12 bg-plaster-dark/20 text-soot hover:bg-plaster-dark/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw size={16} className={inquiryType === 'refund' ? 'text-amber-700' : 'text-moss'} />
                      <span className="font-semibold text-xs sm:text-sm">Refund Request</span>
                    </div>
                    <span className="text-[11px] text-moss leading-tight hidden sm:block">
                      Request pass cancellation refund
                    </span>
                  </button>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(errs => ({ ...errs, name: '' }));
                    }}
                    placeholder="Mohammed Al-Faisal"
                    className={`w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none transition-all shadow-xs ${
                      fieldErrors.name ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/15 focus:ring-2 focus:ring-eucalyptus/40 bg-plaster-dark/30'
                    }`}
                  />
                  {fieldErrors.name && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(errs => ({ ...errs, email: '' }));
                    }}
                    placeholder="name@company.com"
                    className={`w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none transition-all shadow-xs ${
                      fieldErrors.email ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/15 focus:ring-2 focus:ring-eucalyptus/40 bg-plaster-dark/30'
                    }`}
                  />
                  {fieldErrors.email && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.email}</p>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Subject <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value);
                    if (fieldErrors.subject) setFieldErrors(errs => ({ ...errs, subject: '' }));
                  }}
                  placeholder={
                    inquiryType === 'complaint'
                      ? 'e.g., Issue with workspace amenities at Hub Riyadh'
                      : inquiryType === 'refund'
                      ? 'e.g., Cancellation refund request for booking #BK-102'
                      : 'e.g., Question about custom team workspace passes'
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none transition-all shadow-xs ${
                    fieldErrors.subject ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/15 focus:ring-2 focus:ring-eucalyptus/40 bg-plaster-dark/30'
                  }`}
                />
                {fieldErrors.subject && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.subject}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Message Details <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) setFieldErrors(errs => ({ ...errs, message: '' }));
                  }}
                  placeholder={
                    inquiryType === 'complaint'
                      ? 'Please describe the problem in detail...'
                      : inquiryType === 'refund'
                      ? 'Please mention your booking ID and reason for refund request...'
                      : 'Provide details about your inquiry...'
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-soot text-sm placeholder:text-moss/60 focus:outline-none transition-all shadow-xs resize-y ${
                    fieldErrors.message ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/15 focus:ring-2 focus:ring-eucalyptus/40 bg-plaster-dark/30'
                  }`}
                />
                {fieldErrors.message && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.message}</p>}
              </div>

              {/* Image Upload Widget */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Attach Screenshot or Document (Optional)</span>
                  <span className="text-moss font-normal text-[11px] lowercase">Max 5MB (PNG, JPG)</span>
                </label>

                {attachedImage ? (
                  <div className="p-3 bg-plaster-dark/30 rounded-2xl border border-soot/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={attachedImage}
                        alt="Uploaded preview"
                        className="w-14 h-14 object-cover rounded-xl border border-soot/10 shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-soot block truncate">{fileName}</span>
                        <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={12} /> Image attached
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer shrink-0"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-soot/20 hover:border-soot/40 rounded-2xl p-4 bg-plaster-dark/20 hover:bg-plaster-dark/40 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer text-center group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white text-soot flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Upload size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-soot">
                        Click to upload an image <span className="text-moss font-normal">or drag &amp; drop</span>
                      </p>
                      <p className="text-[11px] text-moss mt-0.5">Supports proof photos, receipt screenshots, or supporting documents</p>
                    </div>
                  </label>
                )}
                {fieldErrors.image && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.image}</p>}
              </div>

              {/* Form Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-moss hover:bg-soot text-white font-semibold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="text-white">Submit Support Ticket</span>
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

