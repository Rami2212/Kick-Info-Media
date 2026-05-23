"use client";

import { useState } from "react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="divider"></div>
      <div className="contact-page">
        <h1 className="contact-page-title">Get In Touch</h1>
        <p className="contact-page-desc">
          Have a tip, question, or story idea? We&apos;d love to hear from you.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Name</label>
            <input className="form-input" type="text" id="name" name="name" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input className="form-input" type="email" id="email" name="email" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="subject">Subject</label>
            <input className="form-input" type="text" id="subject" name="subject" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="message">Message</label>
            <textarea className="form-textarea" id="message" name="message" required></textarea>
          </div>

          <button className="form-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>

          {success && (
            <div className="form-success">
              Your message has been sent successfully. We will get back to you soon.
            </div>
          )}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
        </form>
      </div>
    </>
  );
}
