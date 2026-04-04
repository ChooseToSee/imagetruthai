import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be under 255 characters"),
  subject: z.string().trim().max(200, "Subject must be under 200 characters").optional().default(""),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be under 2000 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      const submissionId = crypto.randomUUID();

      // Save to database
      const { error: dbError } = await supabase
        .from("contact_submissions" as any)
        .insert({
          id: submissionId,
          name: data.name,
          email: data.email,
          subject: data.subject || "",
          message: data.message,
        } as any);

      if (dbError) throw new Error("Failed to save your message. Please try again.");

      // Send confirmation email to the submitter
      const confirmPromise = supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: data.email,
          idempotencyKey: `contact-confirm-${submissionId}`,
          templateData: { name: data.name, message: data.message },
        },
      });

      // Send notification emails to all admins
      const notifyRecipients = [
        "jethrun@comcast.net",
        "imagetruthai.test@proton.me",
        "jason.thrun@colliers.com",
      ];
      const notifyPromises = notifyRecipients.map((email) =>
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "contact-notification",
            recipientEmail: email,
            idempotencyKey: `contact-notify-${submissionId}-${email}`,
            templateData: {
              name: data.name,
              email: data.email,
              subject: data.subject || "No subject",
              message: data.message,
            },
          },
        })
      );

      // Fire both emails in parallel — don't block success on email delivery
      await Promise.allSettled([confirmPromise, ...notifyPromises]);

      setSubmittedEmail(data.email);
      setSubmitted(true);
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    } catch (err: any) {
      toast({
        title: "Failed to send message",
        description: err.message || "Something went wrong. Please try again or email us directly at support@imagetruthai.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-lg">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground mb-2">Have a question or feedback? We'd love to hear from you.</p>
          <p className="text-sm text-muted-foreground mb-8">
            Or email us directly at{" "}
            <a href="mailto:support@imagetruthai.com" className="text-primary hover:underline font-medium">
              support@imagetruthai.com
            </a>
          </p>

          {submitted ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Message Sent!</h2>
              <p className="text-sm text-muted-foreground mb-1">We'll get back to you within 24 hours.</p>
              <p className="text-xs text-muted-foreground/70 mb-6">
                A confirmation has been sent to {submittedEmail}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  form.reset();
                }}
                className="text-sm text-primary hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="What's this about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="How can we help?" rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
