'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
  UserCheck,
  Send,
  Building2,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { GazetteArticle } from '@/lib/blogStore';
import { Lead } from '@/components/reception/data/leadsMockData';
import { ReceptionistRecord } from '@/lib/receptionistStore';

type MarketingTab = 'blogs' | 'leads' | 'tracker';

interface ReceptionistStat {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  totalAssigned: number;
  contactedCount: number;
  pendingCount: number;
  convertedCount: number;
  contactedPercentage: number;
  leads: Lead[];
}

export default function MarketingDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<MarketingTab>('blogs');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Data States ─────────────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<GazetteArticle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [receptionists, setReceptionists] = useState<ReceptionistRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [receptionistStats, setReceptionistStats] = useState<ReceptionistStat[]>([]);

  // ── Filter & Search States ──────────────────────────────────────────────────
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadCourseFilter, setLeadCourseFilter] = useState('all');
  const [leadAssignFilter, setLeadAssignFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');

  // ── Multi-select Leads State ────────────────────────────────────────────────
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReceptionistId, setSelectedReceptionistId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // ── Blog Modals State ───────────────────────────────────────────────────────
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<GazetteArticle | null>(null);
  const [blogFormTitle, setBlogFormTitle] = useState('');
  const [blogFormCategory, setBlogFormCategory] = useState('judiciary');
  const [blogFormAuthor, setBlogFormAuthor] = useState('MSI Academic Faculty');
  const [blogFormAuthorRole, setBlogFormAuthorRole] = useState('Faculty of Law');
  const [blogFormReadTime, setBlogFormReadTime] = useState('5 min read');
  const [blogFormExcerpt, setBlogFormExcerpt] = useState('');
  const [blogFormContent, setBlogFormContent] = useState('');
  const [blogFormCoverImage, setBlogFormCoverImage] = useState('');
  const [blogFormPublished, setBlogFormPublished] = useState(true);
  const [isSavingBlog, setIsSavingBlog] = useState(false);

  // ── Blog Delete Modal State ─────────────────────────────────────────────────
  const [blogToDelete, setBlogToDelete] = useState<GazetteArticle | null>(null);
  const [isDeletingBlog, setIsDeletingBlog] = useState(false);

  // ── Tracker Drilldown State ─────────────────────────────────────────────────
  const [expandedReceptionistId, setExpandedReceptionistId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  // ── Auth Guard & Initialization ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('msi_marketing_user');
      if (!stored) {
        router.replace('/marketing/login');
        return;
      }
      setCurrentUser(JSON.parse(stored));
    } catch {
      router.replace('/marketing/login');
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // ── Data Fetchers ───────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    try {
      const res = await fetch('/api/blogs?all=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.blogs)) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.warn('Could not load blogs:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.warn('Could not load leads:', err);
    }
  }, []);

  const fetchReceptionists = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/receptionists', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.receptionists)) {
        setReceptionists(data.receptionists);
      }
    } catch (err) {
      console.warn('Could not load receptionists:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing/stats', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (Array.isArray(data.receptionistStats)) {
          setReceptionistStats(data.receptionistStats);
        }
      }
    } catch (err) {
      console.warn('Could not load marketing stats:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBlogs(), fetchLeads(), fetchReceptionists(), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchBlogs, fetchLeads, fetchReceptionists, fetchStats]);

  useEffect(() => {
    if (currentUser) {
      refreshAll();
    }
  }, [currentUser, refreshAll]);

  const handleLogout = () => {
    localStorage.removeItem('msi_marketing_user');
    router.replace('/marketing/login');
  };

  // ── Blog Handlers ───────────────────────────────────────────────────────────
  const openCreateBlogModal = () => {
    setEditingBlog(null);
    setBlogFormTitle('');
    setBlogFormCategory('judiciary');
    setBlogFormAuthor(currentUser?.name || 'MSI Academic Faculty');
    setBlogFormAuthorRole('Legal Academic Panel');
    setBlogFormReadTime('5 min read');
    setBlogFormExcerpt('');
    setBlogFormContent('');
    setBlogFormCoverImage('');
    setBlogFormPublished(true);
    setShowBlogModal(true);
  };

  const openEditBlogModal = (blog: GazetteArticle) => {
    setEditingBlog(blog);
    setBlogFormTitle(blog.title);
    setBlogFormCategory(blog.category);
    setBlogFormAuthor(blog.author || 'MSI Faculty');
    setBlogFormAuthorRole(blog.authorRole || 'Faculty of Law');
    setBlogFormReadTime(blog.readTime || '5 min read');
    setBlogFormExcerpt(blog.excerpt || '');
    setBlogFormContent(blog.content || blog.fullSummary || '');
    setBlogFormCoverImage(blog.coverImage || '');
    setBlogFormPublished(blog.isPublished !== false);
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogFormTitle.trim()) {
      showToast('Please provide an article title');
      return;
    }

    setIsSavingBlog(true);
    try {
      const payload = {
        id: editingBlog?.id,
        title: blogFormTitle.trim(),
        category: blogFormCategory,
        categoryLabel:
          blogFormCategory === 'judiciary'
            ? 'Judicial Services'
            : blogFormCategory === 'clat'
            ? 'CLAT & NLUs'
            : blogFormCategory === 'pu-law'
            ? 'PU Law Entrance'
            : 'Legal Jurisprudence',
        author: blogFormAuthor.trim(),
        authorRole: blogFormAuthorRole.trim(),
        readTime: blogFormReadTime.trim(),
        excerpt: blogFormExcerpt.trim(),
        content: blogFormContent.trim(),
        coverImage: blogFormCoverImage.trim(),
        isPublished: blogFormPublished,
      };

      const res = await fetch('/api/blogs', {
        method: editingBlog ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingBlog ? 'Article updated successfully!' : 'New article published successfully!');
        setShowBlogModal(false);
        fetchBlogs();
      } else {
        showToast(data.message || 'Failed to save blog post');
      }
    } catch (err) {
      showToast('Network error while saving article');
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;
    setIsDeletingBlog(true);

    try {
      const res = await fetch(`/api/blogs?id=${encodeURIComponent(String(blogToDelete.id))}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Article "${blogToDelete.title.slice(0, 30)}..." permanently deleted.`);
        setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete.id && b.slug !== blogToDelete.slug));
        setBlogToDelete(null);
      } else {
        showToast(data.message || 'Failed to delete article');
      }
    } catch (err) {
      showToast('Network error while deleting article');
    } finally {
      setIsDeletingBlog(false);
    }
  };

  // ── Leads Multi-select Handlers ─────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = leadSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.mobile.includes(q) ||
        l.targetCourse.toLowerCase().includes(q) ||
        (l.agent && l.agent.toLowerCase().includes(q));

      const matchesCourse = leadCourseFilter === 'all' || l.targetCourse === leadCourseFilter;

      const isUnassigned = !l.agent || l.agent === 'Unassigned' || l.agent === 'System / Unassigned';
      const matchesAssign =
        leadAssignFilter === 'all' ||
        (leadAssignFilter === 'unassigned' && isUnassigned) ||
        (leadAssignFilter === 'assigned' && !isUnassigned);

      return matchesSearch && matchesCourse && matchesAssign;
    });
  }, [leads, leadSearch, leadCourseFilter, leadAssignFilter]);

  const isAllLeadsSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedLeadIds.includes(String(l.id)));

  const toggleSelectAllLeads = () => {
    if (isAllLeadsSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => String(l.id)));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openAssignModal = () => {
    if (selectedLeadIds.length === 0) {
      showToast('Please select at least one lead to assign.');
      return;
    }
    setSelectedReceptionistId(receptionists[0]?.id || '');
    setAssignmentNote('');
    setShowAssignModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedReceptionistId) {
      showToast('Please select a receptionist.');
      return;
    }

    const rec = receptionists.find((r) => r.id === selectedReceptionistId);
    const targetName = rec ? rec.name : selectedReceptionistId;

    setIsAssigning(true);
    try {
      const res = await fetch('/api/marketing/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          receptionistId: selectedReceptionistId,
          receptionistName: targetName,
          assignedBy: currentUser?.name || 'Marketing Team',
          note: assignmentNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Successfully assigned ${selectedLeadIds.length} lead(s) to ${targetName}!`);
        setShowAssignModal(false);
        setSelectedLeadIds([]);
        fetchLeads();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to assign leads');
      }
    } catch (err) {
      showToast('Network error while assigning leads');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filtered Blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = blogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q);

      const matchesCategory =
        blogCategoryFilter === 'all' || b.category === blogCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [blogs, blogSearch, blogCategoryFilter]);

  // Unique Courses for Filter Dropdown
  const uniqueCourses = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.targetCourse) set.add(l.targetCourse);
    });
    return Array.from(set);
  }, [leads]);

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#10233F] flex flex-col selection:bg-[#EFC988] selection:text-[#89190E]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#10233F] text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 border border-[#EFC988]/40 animate-slide-in">
          <Sparkles className="w-4 h-4 text-[#EFC988]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-[#EFC988]/30 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#89190E] flex items-center justify-center text-white font-serif font-black shadow-md border border-[#EFC988]/40">
                M
              </div>
              <div>
                <div className="text-sm font-serif font-bold text-[#10233F] tracking-wide">
                  MSI MARKETING DESK
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#89190E] font-bold">
                  Outreach, Content & Lead Distribution
                </div>
              </div>
            </Link>

            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              Marketing Executive
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {currentDateTime && (
              <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDateTime}</span>
              </div>
            )}

            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh All Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#89190E]' : ''}`} />
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <span>View Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#89190E]/10 text-[#89190E] font-bold text-xs flex items-center justify-center border border-[#89190E]/20">
                {currentUser?.name ? currentUser.name.slice(0, 1).toUpperCase() : 'M'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#10233F] leading-tight">
                  {currentUser?.name || 'Marketing Staff'}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser?.phone || 'Authorized Desk'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('blogs')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'blogs'
                ? 'border-[#89190E] text-[#89190E] bg-[#89190E]/5'
                : 'border-transparent text-slate-600 hover:text-[#10233F]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Public Blog CMS</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {blogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leads'
                ? 'border-[#89190E] text-[#89190E] bg-[#89190E]/5'
                : 'border-transparent text-slate-600 hover:text-[#10233F]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lead Distribution Desk</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-3 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'border-[#89190E] text-[#89190E] bg-[#89190E]/5'
                : 'border-transparent text-slate-600 hover:text-[#10233F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Receptionist Follow-up Tracker</span>
            {stats && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {stats.totalContacted}/{stats.totalAssigned} Contacted
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ==================================================================== */}
        {/* TAB 1: BLOGS CMS                                                     */}
        {/* ==================================================================== */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            {/* Top Stats & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EFC988]/30 shadow-xs">
              <div>
                <h2 className="text-lg font-serif font-black text-[#10233F]">
                  Public Website Articles & Gazette CMS
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish, update, or permanently delete blogs featured on the homepage and /blog page.
                </p>
              </div>

              <div className="flex items-center space-x-2.5">
                <Link
                  href="/blog"
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Public /blog</span>
                </Link>

                <button
                  type="button"
                  onClick={openCreateBlogModal}
                  className="px-4 py-2 rounded-xl bg-[#89190E] hover:bg-[#70140B] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Blog</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles by title, author, keyword..."
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 bg-white"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Category:</span>
                <select
                  value={blogCategoryFilter}
                  onChange={(e) => setBlogCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 bg-white"
                >
                  <option value="all">All Categories ({blogs.length})</option>
                  <option value="judiciary">Judicial Services</option>
                  <option value="clat">CLAT & NLUs</option>
                  <option value="pu-law">PU Law Entrance</option>
                  <option value="jurisprudence">Legal Jurisprudence</option>
                </select>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-2xl border border-[#EFC988]/30 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Article Details</th>
                      <th className="py-3 px-4 font-bold">Category</th>
                      <th className="py-3 px-4 font-bold">Author & Role</th>
                      <th className="py-3 px-4 font-bold">Date & Read Time</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBlogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No articles found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredBlogs.map((blog) => (
                        <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#10233F] text-sm leading-snug">
                              {blog.title}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {blog.excerpt || blog.fullSummary}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Slug: /{blog.slug}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-[#89190E]/10 text-[#89190E] font-bold text-[11px]">
                              {blog.categoryLabel || blog.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-[#10233F]">{blog.author}</div>
                            <div className="text-[10px] text-slate-400">{blog.authorRole}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-slate-700 font-medium">{blog.date}</div>
                            <div className="text-[10px] text-slate-400">{blog.readTime}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {blog.isPublished !== false ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center space-x-1 w-max">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Published</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center space-x-1 w-max">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Draft</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Link
                                href={`/blog#${blog.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                                title="View on site"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditBlogModal(blog)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer"
                                title="Edit Article"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setBlogToDelete(blog)}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                title="Permanent Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: LEAD DISTRIBUTION DESK                                        */}
        {/* ==================================================================== */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Lead Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EFC988]/30 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Incoming Leads
                </div>
                <div className="text-2xl font-serif font-black text-[#10233F] mt-1">
                  {leads.length}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Unassigned Queue
                </div>
                <div className="text-2xl font-serif font-black text-amber-600 mt-1">
                  {
                    leads.filter(
                      (l) => !l.agent || l.agent === 'Unassigned' || l.agent === 'System / Unassigned'
                    ).length
                  }
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Assigned to Front Desk
                </div>
                <div className="text-2xl font-serif font-black text-blue-600 mt-1">
                  {
                    leads.filter(
                      (l) => l.agent && l.agent !== 'Unassigned' && l.agent !== 'System / Unassigned'
                    ).length
                  }
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Converted to Enrolled
                </div>
                <div className="text-2xl font-serif font-black text-emerald-600 mt-1">
                  {leads.filter((l) => l.status === 'Converted').length}
                </div>
              </div>
            </div>

            {/* Filter & Multi-Select Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EFC988]/30 shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate name, phone..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 bg-white"
                  />
                </div>

                <select
                  value={leadCourseFilter}
                  onChange={(e) => setLeadCourseFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none bg-white"
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={leadAssignFilter}
                  onChange={(e) => setLeadAssignFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none bg-white"
                >
                  <option value="all">All Assignment Status</option>
                  <option value="unassigned">Unassigned Only</option>
                  <option value="assigned">Assigned Only</option>
                </select>
              </div>

              {/* Floating Action Button */}
              <button
                type="button"
                onClick={openAssignModal}
                disabled={selectedLeadIds.length === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  selectedLeadIds.length > 0
                    ? 'bg-[#89190E] hover:bg-[#70140B] text-white shadow-md shadow-[#89190E]/20'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {selectedLeadIds.length > 0
                    ? `Assign Selected (${selectedLeadIds.length})`
                    : 'Select Leads to Assign'}
                </span>
              </button>
            </div>

            {/* Floating Selection Banner */}
            {selectedLeadIds.length > 0 && (
              <div className="bg-[#10233F] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg border border-[#EFC988]/40 animate-fade-in">
                <div className="flex items-center space-x-2 text-xs font-medium">
                  <CheckSquare className="w-4 h-4 text-[#EFC988]" />
                  <span>
                    <strong>{selectedLeadIds.length}</strong> lead(s) selected for assignment
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadIds([])}
                    className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={openAssignModal}
                    className="px-3 py-1 rounded-lg bg-[#EFC988] text-[#10233F] font-bold text-xs hover:bg-[#ffe3ab] transition-colors cursor-pointer"
                  >
                    Assign to Receptionist
                  </button>
                </div>
              </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-[#EFC988]/30 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAllLeads}
                          className="text-slate-600 hover:text-[#89190E] transition-colors cursor-pointer"
                          title={isAllLeadsSelected ? 'Deselect all' : 'Select all'}
                        >
                          {isAllLeadsSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#89190E]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-bold">Candidate Info</th>
                      <th className="py-3 px-4 font-bold">Target Course</th>
                      <th className="py-3 px-4 font-bold">Source & Received</th>
                      <th className="py-3 px-4 font-bold">Assigned Receptionist</th>
                      <th className="py-3 px-4 font-bold">Call Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No leads matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLeadIds.includes(String(lead.id));
                        const isUnassigned =
                          !lead.agent ||
                          lead.agent === 'Unassigned' ||
                          lead.agent === 'System / Unassigned';
                        const hasRemarks =
                          Array.isArray(lead.remarksHistory) && lead.remarksHistory.length > 0;

                        return (
                          <tr
                            key={lead.id}
                            className={`transition-colors ${
                              isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectLead(String(lead.id))}
                                className="cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#89190E]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#10233F]">{lead.name}</div>
                              <div className="text-slate-500 font-mono text-[11px] flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{lead.mobile}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{lead.targetCourse}</div>
                              {lead.location && (
                                <div className="text-[10px] text-slate-400">{lead.location}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                                {lead.source || 'Website'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {lead.receivedDate}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isUnassigned ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                                  Unassigned
                                </span>
                              ) : (
                                <div>
                                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                                    {lead.agent}
                                  </span>
                                  {lead.assignedAt && (
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      Assigned {new Date(lead.assignedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {hasRemarks || lead.status !== 'New' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  {lead.status === 'New' ? 'Contacted' : lead.status}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                  Pending Call
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: RECEPTIONIST FOLLOW-UP TRACKER                                */}
        {/* ==================================================================== */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#EFC988]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-black text-[#10233F]">
                  Front Desk Lead Engagement & Follow-up Tracker
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor in real-time how many assigned leads each receptionist has contacted and converted.
                </p>
              </div>

              {stats && (
                <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Overall Contact Ratio
                    </div>
                    <div className="text-base font-bold text-[#89190E]">
                      {stats.totalContacted} / {stats.totalAssigned} Contacted ({stats.overallPercentage}%)
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#89190E]/10 flex items-center justify-center text-[#89190E] font-bold text-xs">
                    {stats.overallPercentage}%
                  </div>
                </div>
              )}
            </div>

            {/* Receptionists Performance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {receptionistStats.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-[#EFC988]/30 shadow-xs p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-[#10233F]">{rec.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{rec.phone}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    {/* Progress Highlight */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-600">Contacted Ratio:</span>
                        <span className="font-mono font-bold text-[#89190E]">
                          {rec.contactedCount} / {rec.totalAssigned} ({rec.contactedPercentage}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, rec.contactedPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                        <div className="text-xs font-bold text-blue-700">{rec.totalAssigned}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                          Assigned
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                        <div className="text-xs font-bold text-amber-700">{rec.pendingCount}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                          Pending
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-700">{rec.convertedCount}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                          Converted
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Leads List */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReceptionistId(
                          expandedReceptionistId === rec.id ? null : rec.id
                        )
                      }
                      className="w-full py-1.5 text-xs font-bold text-slate-600 hover:text-[#89190E] flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <span>
                        {expandedReceptionistId === rec.id
                          ? 'Hide Assigned Leads'
                          : `View Leads Queue (${rec.leads.length})`}
                      </span>
                      {expandedReceptionistId === rec.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Expanded Leads Preview */}
                    {expandedReceptionistId === rec.id && (
                      <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {rec.leads.length === 0 ? (
                          <div className="text-[11px] text-slate-400 text-center py-2">
                            No leads assigned yet.
                          </div>
                        ) : (
                          rec.leads.map((l) => (
                            <div
                              key={l.id}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-[#10233F]">{l.name}</div>
                                <div className="text-slate-400">{l.mobile}</div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  l.status === 'Converted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : l.status === 'Follow-up'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {l.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE / EDIT BLOG POST                                     */}
      {/* ==================================================================== */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#EFC988]/50 shadow-2xl relative animate-scale-in">
            <h3 className="text-lg font-serif font-black text-[#10233F] mb-1">
              {editingBlog ? 'Edit Blog Article' : 'Create & Publish New Blog Article'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Articles published here appear in real-time on the public /blog page and homepage Gazette section.
            </p>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cracking Judicial Services Exam 2026: Strategy & Judgment Writing"
                  value={blogFormTitle}
                  onChange={(e) => setBlogFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={blogFormCategory}
                    onChange={(e) => setBlogFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none bg-white"
                  >
                    <option value="judiciary">Judicial Services</option>
                    <option value="clat">CLAT & NLUs</option>
                    <option value="pu-law">PU Law Entrance</option>
                    <option value="jurisprudence">Legal Jurisprudence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 min read"
                    value={blogFormReadTime}
                    onChange={(e) => setBlogFormReadTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adv. Rajesh Kumar"
                    value={blogFormAuthor}
                    onChange={(e) => setBlogFormAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Head — Judiciary Division"
                    value={blogFormAuthorRole}
                    onChange={(e) => setBlogFormAuthorRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Excerpt / Summary (Appears in Card Preview) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief synopsis summarizing the key takeaway of this article..."
                  value={blogFormExcerpt}
                  onChange={(e) => setBlogFormExcerpt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Article Body / Content *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Detailed article paragraphs, analysis, statutory references..."
                  value={blogFormContent}
                  onChange={(e) => setBlogFormContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="publishToggle"
                  checked={blogFormPublished}
                  onChange={(e) => setBlogFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-[#89190E] focus:ring-[#89190E]"
                />
                <label htmlFor="publishToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publish to Public Website Immediately
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-5 py-2 rounded-xl bg-[#89190E] hover:bg-[#70140B] text-white text-xs font-bold shadow-md shadow-[#89190E]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingBlog ? 'Publishing...' : editingBlog ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PERMANENT DELETE BLOG CONFIRMATION                          */}
      {/* ==================================================================== */}
      {blogToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-red-200 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-black text-[#10233F]">
              Permanently Delete Article?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong>"{blogToDelete.title}"</strong>?
            </p>
            <p className="text-[11px] text-red-600 mt-2 font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
              This will permanently remove the article from the public website, database, and archive. It will not reappear on refresh.
            </p>

            <div className="flex items-center justify-end space-x-2 mt-5">
              <button
                type="button"
                onClick={() => setBlogToDelete(null)}
                disabled={isDeletingBlog}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={isDeletingBlog}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingBlog ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: ASSIGN LEADS TO RECEPTIONIST                                */}
      {/* ==================================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#EFC988]/50 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-[#89190E]/10 text-[#89190E] flex items-center justify-center mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-black text-[#10233F]">
              Assign {selectedLeadIds.length} Lead(s) to Receptionist
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select the Front Desk receptionist who will receive these leads in their calling queue.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Receptionist Desk *
                </label>
                <select
                  value={selectedReceptionistId}
                  onChange={(e) => setSelectedReceptionistId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#10233F] focus:outline-none bg-white"
                >
                  {receptionists.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.phone}) — {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assignment Note / Campaign Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priority leads from Chandigarh Instagram Campaign"
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isAssigning}
                className="px-5 py-2 rounded-xl bg-[#89190E] hover:bg-[#70140B] text-white text-xs font-bold shadow-md shadow-[#89190E]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAssigning ? 'Assigning...' : `Confirm & Route (${selectedLeadIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

