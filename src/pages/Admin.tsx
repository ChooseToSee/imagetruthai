import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";

const ADMIN_EMAIL = "jethrun@comcast.net";

type TimeRange = "24h" | "7d" | "30d" | "all";

interface ContactSubmission {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
}

interface EmailLog {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  metadata: unknown;
  created_at: string;
}

interface FeedbackEntry {
  id: string;
  created_at: string;
  type: string;
  message: string;
  user_email: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "sent":
      return "bg-success/20 text-success border-success/30";
    case "dlq":
    case "failed":
    case "bounced":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "suppressed":
    case "complained":
      return "bg-warning/20 text-warning border-warning/30";
    case "pending":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <CheckCircle className="h-3 w-3" />;
    case "dlq":
    case "failed":
    case "bounced":
      return <XCircle className="h-3 w-3" />;
    case "pending":
      return <Clock className="h-3 w-3" />;
    default:
      return <AlertTriangle className="h-3 w-3" />;
  }
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [emailStatusFilter, setEmailStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-admin-data");
        if (error) throw error;
        setContacts(data.contacts || []);
        setEmails(data.emails || []);
        setFeedback(data.feedback || []);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  const cutoffDate = useMemo(() => {
    if (timeRange === "all") return null;
    const now = new Date();
    const hours = timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }, [timeRange]);

  const filterByTime = <T extends { created_at: string }>(items: T[]) =>
    cutoffDate ? items.filter((i) => new Date(i.created_at) >= cutoffDate) : items;

  const deduplicatedEmails = useMemo(() => {
    const map = new Map<string, EmailLog>();
    for (const e of emails) {
      const key = e.message_id || e.id;
      const existing = map.get(key);
      if (!existing || new Date(e.created_at) > new Date(existing.created_at)) {
        map.set(key, e);
      }
    }
    return Array.from(map.values());
  }, [emails]);

  const filteredEmails = useMemo(() => {
    let result = filterByTime(deduplicatedEmails);
    if (emailStatusFilter !== "all") {
      result = result.filter((e) => e.status === emailStatusFilter);
    }
    if (templateFilter !== "all") {
      result = result.filter((e) => e.template_name === templateFilter);
    }
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [deduplicatedEmails, emailStatusFilter, templateFilter, cutoffDate]);

  const filteredContacts = useMemo(() => {
    let result = filterByTime(contacts);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contacts, cutoffDate, searchQuery]);

  const filteredFeedback = useMemo(() => filterByTime(feedback), [feedback, cutoffDate]);

  const templateNames = useMemo(
    () => [...new Set(deduplicatedEmails.map((e) => e.template_name))].sort(),
    [deduplicatedEmails]
  );

  const emailStats = useMemo(() => {
    const timeFiltered = filterByTime(deduplicatedEmails);
    return {
      total: timeFiltered.length,
      sent: timeFiltered.filter((e) => e.status === "sent").length,
      failed: timeFiltered.filter((e) =>
        ["dlq", "failed", "bounced"].includes(e.status)
      ).length,
      suppressed: timeFiltered.filter((e) =>
        ["suppressed", "complained"].includes(e.status)
      ).length,
      pending: timeFiltered.filter((e) => e.status === "pending").length,
    };
  }, [deduplicatedEmails, cutoffDate]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(["24h", "7d", "30d", "all"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "24h"
                ? "Last 24h"
                : range === "7d"
                ? "Last 7 days"
                : range === "30d"
                ? "Last 30 days"
                : "All time"}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="emails" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="h-4 w-4" /> Emails
                <Badge variant="secondary" className="ml-1 text-xs">
                  {emailStats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Contacts
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredContacts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageCircle className="h-4 w-4" /> Feedback
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredFeedback.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Total", value: emailStats.total, icon: Mail },
                  { label: "Sent", value: emailStats.sent, icon: CheckCircle },
                  { label: "Failed", value: emailStats.failed, icon: XCircle },
                  { label: "Suppressed", value: emailStats.suppressed, icon: AlertTriangle },
                  { label: "Pending", value: emailStats.pending, icon: Clock },
                ].map((s) => (
                  <Card key={s.label} className="border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <s.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="dlq">Failed</SelectItem>
                    <SelectItem value="suppressed">Suppressed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templateNames.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmails.slice(0, 50).map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">
                              {e.template_name}
                            </TableCell>
                            <TableCell className="text-sm">{e.recipient_email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`gap-1 ${statusColor(e.status)}`}
                              >
                                {statusIcon(e.status)}
                                {e.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(e.created_at), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                              {e.error_message || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <Input
                placeholder="Search by name, email, or subject…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Card className="border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No submissions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContacts.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-sm">{c.email}</TableCell>
                            <TableCell className="text-sm">{c.subject || "—"}</TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">
                              {c.message}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(c.created_at), "MMM d, HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card className="border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeedback.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No feedback found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFeedback.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell>
                              <Badge variant="outline">{f.type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{f.user_email}</TableCell>
                            <TableCell className="text-sm max-w-[400px] truncate">
                              {f.message}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(f.created_at), "MMM d, HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}
