'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Link2,
  Globe,
  X,
  FileCode,
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
  const [activeBlogTab, setActiveBlogTab] = useState<'content' | 'media' | 'seo'>('content');
  const [blogFormTitle, setBlogFormTitle] = useState('');
  const [blogFormCategory, setBlogFormCategory] = useState('judiciary');
  const [blogFormAuthor, setBlogFormAuthor] = useState('MSI Academic Faculty');
  const [blogFormAuthorRole, setBlogFormAuthorRole] = useState('Faculty of Law');
  const [blogFormReadTime, setBlogFormReadTime] = useState('5 min read');
  const [blogFormExcerpt, setBlogFormExcerpt] = useState('');
  const [blogFormContent, setBlogFormContent] = useState('');
  const [blogFormCoverImage, setBlogFormCoverImage] = useState('');
  const [blogFormPublished, setBlogFormPublished] = useState(true);
  const [blogFormMetaTitle, setBlogFormMetaTitle] = useState('');
  const [blogFormMetaDescription, setBlogFormMetaDescription] = useState('');
  const [blogFormUrlRewrite, setBlogFormUrlRewrite] = useState('');
  const [blogFormCanonicalUrl, setBlogFormCanonicalUrl] = useState('');
  const [isUrlRewriteManual, setIsUrlRewriteManual] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);

  // ── Floating Selection Toolbar State ────────────────────────────────────────
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    start: number;
    end: number;
    selectedText: string;
  }>({ visible: false, x: 0, y: 0, start: 0, end: 0, selectedText: '' });
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

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
  const handleTitleChange = (newTitle: string) => {
    setBlogFormTitle(newTitle);
    if (!isUrlRewriteManual) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setBlogFormUrlRewrite(generatedSlug);
      if (!blogFormCanonicalUrl || blogFormCanonicalUrl.includes('/blog/')) {
        setBlogFormCanonicalUrl(`https://www.msiinstitutes.com/blog/${generatedSlug}`);
      }
    }
    if (!blogFormMetaTitle || blogFormMetaTitle === blogFormTitle) {
      setBlogFormMetaTitle(newTitle);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file size must be under 8MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setBlogFormCoverImage(data.url);
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.message || 'Image upload failed');
      }
    } catch (err) {
      showToast('Network error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertContentSnippet = (prefix: string, placeholder: string = '', suffix: string = '') => {
    setBlogFormContent((prev) => {
      const addition = `${prefix}${placeholder}${suffix}`;
      return prev ? `${prev}\n\n${addition}` : addition;
    });
  };

  // ── Floating Toolbar Helpers ─────────────────────────────────────────────────
  const handleTextareaSelect = () => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) {
      setSelectionToolbar((p) => ({ ...p, visible: false }));
      return;
    }
    const selectedText = ta.value.substring(start, end);
    // Position toolbar above the cursor using textarea bounding rect
    const rect = ta.getBoundingClientRect();
    // Approximate caret position using character offset
    const lines = ta.value.substring(0, end).split('\n');
    const lineCount = lines.length;
    const lineHeight = 18; // approx px per line in mono font
    const topOffset = Math.min((lineCount - 1) * lineHeight + 4, ta.clientHeight - 60);
    setSelectionToolbar({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top + topOffset + window.scrollY,
      start,
      end,
      selectedText,
    });
    setShowFontDropdown(false);
    setShowTextColorPicker(false);
    setShowBgColorPicker(false);
  };

  const applyFormatToSelection = (prefix: string, suffix: string = '') => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const { start, end, selectedText } = selectionToolbar;
    const before = blogFormContent.substring(0, start);
    const after = blogFormContent.substring(end);
    const formatted = `${prefix}${selectedText}${suffix}`;
    const newContent = before + formatted + after;
    setBlogFormContent(newContent);
    setSelectionToolbar((p) => ({ ...p, visible: false }));
    // Restore focus
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const applyHeadingToSelection = (level: '## ' | '### ') => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const { start, selectedText } = selectionToolbar;
    // Find start of line
    const textBefore = blogFormContent.substring(0, start);
    const lineStart = textBefore.lastIndexOf('\n') + 1;
    const before = blogFormContent.substring(0, lineStart);
    const after = blogFormContent.substring(lineStart);
    // Remove any existing heading prefix
    const cleaned = after.replace(/^#{1,6}\s*/, '');
    const newContent = before + level + cleaned;
    setBlogFormContent(newContent);
    setSelectionToolbar((p) => ({ ...p, visible: false }));
    setTimeout(() => ta.focus(), 10);
  };

  const applyFontStyleToSelection = (fontTag: string) => {
    // We store as HTML-comment hint for font: <!--font:fontTag-->text<!--/font-->
    // But simpler: wrap in a custom markdown-ish token
    applyFormatToSelection(`[font:${fontTag}]`, `[/font]`);
    setShowFontDropdown(false);
  };

  const applyTextColorToSelection = (color: string) => {
    applyFormatToSelection(`[color:${color}]`, `[/color]`);
    setShowTextColorPicker(false);
  };

  const applyBgColorToSelection = (color: string) => {
    applyFormatToSelection(`[bg:${color}]`, `[/bg]`);
    setShowBgColorPicker(false);
  };

  // Close toolbar on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        floatingToolbarRef.current &&
        !floatingToolbarRef.current.contains(e.target as Node) &&
        contentTextareaRef.current &&
        !contentTextareaRef.current.contains(e.target as Node)
      ) {
        setSelectionToolbar((p) => ({ ...p, visible: false }));
        setShowFontDropdown(false);
        setShowTextColorPicker(false);
        setShowBgColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCreateBlogModal = () => {
    setEditingBlog(null);
    setActiveBlogTab('content');
    setBlogFormTitle('');
    setBlogFormCategory('judiciary');
    setBlogFormAuthor(currentUser?.name || 'MSI Academic Faculty');
    setBlogFormAuthorRole('Legal Academic Panel');
    setBlogFormReadTime('5 min read');
    setBlogFormExcerpt('');
    setBlogFormContent('');
    setBlogFormCoverImage('');
    setBlogFormMetaTitle('');
    setBlogFormMetaDescription('');
    setBlogFormUrlRewrite('');
    setBlogFormCanonicalUrl('');
    setIsUrlRewriteManual(false);
    setBlogFormPublished(true);
    setShowBlogModal(true);
  };

  const openEditBlogModal = (blog: GazetteArticle) => {
    setEditingBlog(blog);
    setActiveBlogTab('content');
    setBlogFormTitle(blog.title || '');
    setBlogFormCategory(blog.category || 'judiciary');
    setBlogFormAuthor(blog.author || 'MSI Faculty');
    setBlogFormAuthorRole(blog.authorRole || 'Faculty of Law');
    setBlogFormReadTime(blog.readTime || '5 min read');
    setBlogFormExcerpt(blog.excerpt || '');
    setBlogFormContent(blog.content || blog.fullSummary || '');
    setBlogFormCoverImage(blog.coverImage || '');
    setBlogFormMetaTitle(blog.metaTitle || blog.title || '');
    setBlogFormMetaDescription(blog.metaDescription || blog.excerpt || '');
    setBlogFormUrlRewrite(blog.urlRewrite || blog.slug || '');
    setBlogFormCanonicalUrl(blog.canonicalUrl || `https://www.msiinstitutes.com/blog/${blog.slug}`);
    setIsUrlRewriteManual(true);
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
      const cleanSlug = blogFormUrlRewrite.trim()
        ? blogFormUrlRewrite
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : blogFormTitle
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

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
        metaTitle: blogFormMetaTitle.trim() || blogFormTitle.trim(),
        metaDescription: blogFormMetaDescription.trim() || blogFormExcerpt.trim(),
        urlRewrite: cleanSlug,
        canonicalUrl: blogFormCanonicalUrl.trim() || `https://www.msiinstitutes.com/blog/${cleanSlug}`,
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
                                href={`/blog/${blog.slug}`}
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
                                  {(lead as any).assignedAt && (
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                      Assigned {new Date((lead as any).assignedAt).toLocaleDateString()}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 border border-[#EFC988]/50 shadow-2xl relative animate-scale-in my-6 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-serif font-black text-[#10233F]">
                  {editingBlog ? 'Edit Blog Article' : 'Create & Publish New Blog Article'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publishes instantly to <code className="bg-slate-100 text-[#89190E] px-1 py-0.5 rounded text-[11px] font-mono">/blog/{blogFormUrlRewrite || 'slug'}</code> (clean dynamic route without #)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 pt-3 pb-3 border-b border-slate-100 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveBlogTab('content')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeBlogTab === 'content'
                    ? 'bg-[#89190E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Article & Full Content</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBlogTab('media')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                  activeBlogTab === 'media'
                    ? 'bg-[#89190E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>2. Image Upload</span>
                {blogFormCoverImage && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Image attached" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveBlogTab('seo')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeBlogTab === 'seo'
                    ? 'bg-[#89190E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3. SEO & Permalinks</span>
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleSaveBlog} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* TAB 1: ARTICLE & FULL CONTENT */}
              {activeBlogTab === 'content' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cracking Judicial Services Exam 2026: Strategy & Judgment Writing"
                      value={blogFormTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
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
                      Short Excerpt / Summary (Card Preview) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Brief synopsis summarizing the key takeaway of this article..."
                      value={blogFormExcerpt}
                      onChange={(e) => {
                        setBlogFormExcerpt(e.target.value);
                        if (!blogFormMetaDescription || blogFormMetaDescription === blogFormExcerpt) {
                          setBlogFormMetaDescription(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                    />
                  </div>

                  {/* 5. FULL CONTENT WITH MS WORD-LIKE FLOATING SELECTION TOOLBAR */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Full Content (Detailed Article Body) *
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Select text → floating toolbar appears
                      </span>
                    </div>

                    {/* Quick Formatting Toolbar (top static buttons) */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-t-xl text-[11px]">
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('## ', 'Section Heading')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                        title="Add H2 Heading"
                      >
                        + H2 Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('### ', 'Key Takeaway Subheading')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 cursor-pointer"
                        title="Add H3 Subheading"
                      >
                        + H3 Subheading
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('**', 'Bold Legal Precedent', '**')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                        title="Add Bold Text"
                      >
                        B Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('- ', 'Key Examination Point or Strategy')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                        title="Add Bullet Point"
                      >
                        • Bullet List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('> Legal Ratio: ', 'Citation or landmark judgment ratio here...')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-[#89190E] font-medium border border-slate-200 cursor-pointer"
                        title="Add Quote / Citation"
                      >
                        &ldquo; Legal Quote / Ratio
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('\n---\n')}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                        title="Add Section Divider"
                      >
                        ― Divider
                      </button>
                    </div>

                    <textarea
                      ref={contentTextareaRef}
                      rows={8}
                      required
                      placeholder={`Write the full article body here...\n\n## Examination Strategy & Analysis\nBreak down procedural aspects, relevant statutes (BNSS, CPC, BSA, Constitution), and legal arguments.\n\n> Key Legal Ratio: Insert important case citations or statutory mandates here.\n\n- Crucial point for Mains judgment writing\n- Time management and syllabus prioritization`}
                      value={blogFormContent}
                      onChange={(e) => setBlogFormContent(e.target.value)}
                      onMouseUp={handleTextareaSelect}
                      onKeyUp={handleTextareaSelect}
                      className="w-full px-3 py-2.5 rounded-b-xl border border-slate-200 border-t-0 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 font-mono leading-relaxed bg-white"
                    />

                    {/* ── MS Word-Style Floating Selection Toolbar ───────────────── */}
                    {selectionToolbar.visible && (
                      <div
                        ref={floatingToolbarRef}
                        style={{
                          position: 'fixed',
                          left: `${selectionToolbar.x}px`,
                          top: `${selectionToolbar.y - 52}px`,
                          transform: 'translateX(-50%)',
                          zIndex: 9999,
                        }}
                        className="flex items-center gap-0.5 bg-[#1a1a2e] border border-white/10 shadow-2xl rounded-xl px-2 py-1.5 animate-scale-in"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {/* Arrow pointer */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1a1a2e',
                          }}
                        />

                        {/* Bold Button */}
                        <button
                          type="button"
                          title="Bold"
                          onClick={() => applyFormatToSelection('**', '**')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white font-black text-sm transition-all cursor-pointer"
                        >
                          B
                        </button>

                        {/* Italic Button */}
                        <button
                          type="button"
                          title="Italic"
                          onClick={() => applyFormatToSelection('*', '*')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white italic font-semibold text-sm transition-all cursor-pointer"
                        >
                          I
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/20 mx-0.5" />

                        {/* H2 Heading */}
                        <button
                          type="button"
                          title="H2 Heading"
                          onClick={() => applyHeadingToSelection('## ')}
                          className="px-1.5 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-[#EFC988] font-black text-[11px] transition-all cursor-pointer whitespace-nowrap"
                        >
                          H2
                        </button>

                        {/* H3 Heading */}
                        <button
                          type="button"
                          title="H3 Subheading"
                          onClick={() => applyHeadingToSelection('### ')}
                          className="px-1.5 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-[#EFC988]/70 font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap"
                        >
                          H3
                        </button>

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/20 mx-0.5" />

                        {/* Font Style Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            title="Font Style"
                            onClick={() => {
                              setShowFontDropdown((p) => !p);
                              setShowTextColorPicker(false);
                              setShowBgColorPicker(false);
                            }}
                            className="px-2 h-7 flex items-center gap-1 rounded-lg hover:bg-white/15 text-white text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap"
                          >
                            <span style={{ fontFamily: 'serif' }}>Aa</span>
                            <svg width="8" height="5" viewBox="0 0 8 5" fill="none"><path d="M1 1l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </button>
                          {showFontDropdown && (
                            <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[150px] z-50">
                              {[
                                { label: 'Serif (Classic)', value: 'georgia', style: { fontFamily: 'Georgia, serif' } },
                                { label: 'Sans-Serif', value: 'sans-serif', style: { fontFamily: 'Arial, sans-serif' } },
                                { label: 'Monospace', value: 'monospace', style: { fontFamily: 'Courier New, monospace' } },
                                { label: 'Playfair', value: 'playfair', style: { fontFamily: '"Playfair Display", serif' } },
                                { label: 'Modern (Inter)', value: 'inter', style: { fontFamily: 'Inter, sans-serif' } },
                              ].map((font) => (
                                <button
                                  key={font.value}
                                  type="button"
                                  onClick={() => applyFontStyleToSelection(font.value)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                                  style={font.style}
                                >
                                  {font.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/20 mx-0.5" />

                        {/* Text Color */}
                        <div className="relative">
                          <button
                            type="button"
                            title="Text Color"
                            onClick={() => {
                              setShowTextColorPicker((p) => !p);
                              setShowFontDropdown(false);
                              setShowBgColorPicker(false);
                            }}
                            className="w-7 h-7 flex flex-col items-center justify-center rounded-lg hover:bg-white/15 transition-all cursor-pointer"
                          >
                            <span className="text-white font-bold text-[11px] leading-none">A</span>
                            <div className="w-4 h-1 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6)' }} />
                          </button>
                          {showTextColorPicker && (
                            <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 z-50 w-[160px]">
                              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Text Color</div>
                              <div className="grid grid-cols-6 gap-1">
                                {[
                                  '#000000','#374151','#6b7280','#ef4444','#dc2626','#b91c1c',
                                  '#f59e0b','#d97706','#92400e','#22c55e','#16a34a','#166534',
                                  '#3b82f6','#2563eb','#1d4ed8','#8b5cf6','#7c3aed','#6d28d9',
                                  '#ec4899','#db2777','#be185d','#06b6d4','#0891b2','#89190E',
                                ].map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    title={color}
                                    onClick={() => applyTextColorToSelection(color)}
                                    className="w-5 h-5 rounded-md border border-white/50 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Background Color */}
                        <div className="relative">
                          <button
                            type="button"
                            title="Highlight / Background Color"
                            onClick={() => {
                              setShowBgColorPicker((p) => !p);
                              setShowFontDropdown(false);
                              setShowTextColorPicker(false);
                            }}
                            className="w-7 h-7 flex flex-col items-center justify-center rounded-lg hover:bg-white/15 transition-all cursor-pointer"
                          >
                            <span className="text-[9px] font-black text-white leading-none">BG</span>
                            <div className="w-4 h-1 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#fef08a,#bbf7d0,#bfdbfe,#fce7f3)' }} />
                          </button>
                          {showBgColorPicker && (
                            <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 z-50 w-[160px]">
                              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Highlight Color</div>
                              <div className="grid grid-cols-6 gap-1">
                                {[
                                  '#fef08a','#fde68a','#fbbf24','#bbf7d0','#86efac','#4ade80',
                                  '#bfdbfe','#93c5fd','#60a5fa','#fce7f3','#f9a8d4','#f472b6',
                                  '#e9d5ff','#d8b4fe','#c084fc','#fed7aa','#fdba74','#fb923c',
                                  '#ffffff','#f1f5f9','#e2e8f0','#cbd5e1','#94a3b8','#64748b',
                                ].map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    title={color}
                                    onClick={() => applyBgColorToSelection(color)}
                                    className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/20 mx-0.5" />

                        {/* Strikethrough */}
                        <button
                          type="button"
                          title="Strikethrough"
                          onClick={() => applyFormatToSelection('~~', '~~')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white text-sm transition-all cursor-pointer line-through"
                        >
                          S
                        </button>

                        {/* Dismiss */}
                        <div className="w-px h-5 bg-white/20 mx-0.5" />
                        <button
                          type="button"
                          title="Dismiss toolbar"
                          onClick={() => setSelectionToolbar((p) => ({ ...p, visible: false }))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/30 text-white/50 hover:text-white text-xs transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE UPLOAD OPTION */}
              {activeBlogTab === 'media' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Featured Cover Image Upload *
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Upload an image file directly from your computer or provide an image link. Displayed on public blog cards and article header.
                    </p>

                    {/* Drag-and-drop / Click file upload zone */}
                    <div className="relative border-2 border-dashed border-slate-300 hover:border-[#89190E]/60 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-slate-50">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploadingImage}
                      />
                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[#89190E]/10 text-[#89190E] flex items-center justify-center">
                          {isUploadingImage ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-[#89190E]" />
                          ) : (
                            <Upload className="w-6 h-6 text-[#89190E]" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#10233F]">
                          {isUploadingImage ? 'Uploading image to server...' : 'Click to Browse or Drag & Drop Cover Image'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Supports PNG, JPG, WebP (Recommended: 1200 &times; 630 px, max 8MB)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Image Preview if uploaded or provided */}
                  {blogFormCoverImage && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Cover Image Preview</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setBlogFormCoverImage('')}
                          className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Image</span>
                        </button>
                      </div>

                      <div className="relative h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={blogFormCoverImage}
                          alt="Article Cover Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200';
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1.5 truncate">
                        URL: {blogFormCoverImage}
                      </div>
                    </div>
                  )}

                  {/* Secondary direct URL input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Or Paste Image Direct URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... or /uploads/blogs/..."
                          value={blogFormCoverImage}
                          onChange={(e) => setBlogFormCoverImage(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      {blogFormCoverImage && (
                        <button
                          type="button"
                          onClick={() => setBlogFormCoverImage('')}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Legal Stock Image Presets */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Quick Legal Presets (1-Click Apply)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          name: 'Judiciary Gavel',
                          url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000',
                        },
                        {
                          name: 'Law Library',
                          url: 'https://images.unsplash.com/photo-1453733197781-7917208d13a9?auto=format&fit=crop&q=80&w=1000',
                        },
                        {
                          name: 'Moot Court',
                          url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1000',
                        },
                        {
                          name: 'Constitutional Bench',
                          url: 'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?auto=format&fit=crop&q=80&w=1000',
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBlogFormCoverImage(preset.url)}
                          className="text-left p-2 rounded-lg border border-slate-200 hover:border-[#89190E] hover:bg-slate-50 transition-all cursor-pointer text-[11px] font-bold text-slate-700 truncate"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEO & PERMALINKS (Meta title, Meta description, URL rewrite, Canonical Tag) */}
              {activeBlogTab === 'seo' && (
                <div className="space-y-4 animate-fade-in">
                  {/* 3. URL REWRITE (NO '#' - CLEAN DYNAMIC PERMALINK) */}
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Link2 className="w-3.5 h-3.5 text-[#89190E]" />
                        <span>3. URL Rewrite / Permalink (No &ldquo;#&rdquo;) *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const generatedSlug = blogFormTitle
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');
                          setBlogFormUrlRewrite(generatedSlug);
                          setBlogFormCanonicalUrl(`https://www.msiinstitutes.com/blog/${generatedSlug}`);
                          setIsUrlRewriteManual(false);
                        }}
                        className="text-[11px] font-bold text-[#89190E] hover:underline cursor-pointer"
                      >
                        Auto-generate from Title
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Clean SEO URL path. Previous <code className="text-red-700 font-mono font-bold">#hash</code> fragment removed & replaced with direct dynamic route <code className="text-emerald-700 font-mono font-bold">/blog/[slug]</code>.
                    </p>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#89190E]/30">
                      <span className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-xs font-mono text-slate-500 whitespace-nowrap">
                        https://www.msiinstitutes.com/blog/
                      </span>
                      <input
                        type="text"
                        placeholder="mastering-clat-passage-based-reasoning-gk"
                        value={blogFormUrlRewrite}
                        onChange={(e) => {
                          setIsUrlRewriteManual(true);
                          setBlogFormUrlRewrite(e.target.value);
                          setBlogFormCanonicalUrl(
                            `https://www.msiinstitutes.com/blog/${e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-_]+/g, '-')
                              .replace(/(^-|-$)/g, '')}`
                          );
                        }}
                        className="w-full px-3 py-2 text-xs font-mono text-[#10233F] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 1. META TITLE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. SEO Meta Title *
                      </label>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            blogFormMetaTitle.length > 60 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {blogFormMetaTitle.length}/60 chars
                        </span>
                        <button
                          type="button"
                          onClick={() => setBlogFormMetaTitle(blogFormTitle)}
                          className="text-[11px] text-[#89190E] hover:underline cursor-pointer"
                        >
                          Use Title
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Mastering CLAT Passage Reasoning | MSI Institute"
                      value={blogFormMetaTitle}
                      onChange={(e) => setBlogFormMetaTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Appears in browser tab and search engine results snippet (50-60 characters recommended).
                    </span>
                  </div>

                  {/* 2. META DESCRIPTION */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        2. SEO Meta Description *
                      </label>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            blogFormMetaDescription.length > 160 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {blogFormMetaDescription.length}/160 chars
                        </span>
                        <button
                          type="button"
                          onClick={() => setBlogFormMetaDescription(blogFormExcerpt)}
                          className="text-[11px] text-[#89190E] hover:underline cursor-pointer"
                        >
                          Use Excerpt
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Concise overview summarizing law examination strategies, statutory references, and MSI classroom insights..."
                      value={blogFormMetaDescription}
                      onChange={(e) => setBlogFormMetaDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Appears under the blue title in search engine results (140-160 characters recommended).
                    </span>
                  </div>

                  {/* 4. CANONICAL TAG */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        4. Canonical Tag (rel=&quot;canonical&quot;)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const slug = blogFormUrlRewrite || 'article';
                          setBlogFormCanonicalUrl(`https://www.msiinstitutes.com/blog/${slug}`);
                        }}
                        className="text-[11px] text-[#89190E] hover:underline cursor-pointer"
                      >
                        Set Default Canonical
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://www.msiinstitutes.com/blog/..."
                        value={blogFormCanonicalUrl}
                        onChange={(e) => setBlogFormCanonicalUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Prevents duplicate content penalties by declaring the authoritative URL version to Google crawlers.
                    </span>
                  </div>

                  {/* LIVE GOOGLE SEARCH SERP SNIPPET PREVIEW */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google Search (SERP) Live Snippet Preview</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-[11px] text-[#202124]">
                        <div className="w-4 h-4 rounded-full bg-[#89190E] flex items-center justify-center text-[9px] text-white font-bold">
                          M
                        </div>
                        <span className="font-medium">MSI Institutes</span>
                        <span className="text-slate-400">&rsaquo;</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          blog &rsaquo; {blogFormUrlRewrite || 'mastering-clat-passage-based-reasoning-gk'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                        {blogFormMetaTitle || blogFormTitle || 'Article Title | MSI Institutes Law Academy'}
                      </div>
                      <div className="text-xs text-[#4d5156] line-clamp-2">
                        {blogFormMetaDescription ||
                          blogFormExcerpt ||
                          'Comprehensive analysis, case law references, and structured preparation roadmap for Judicial Services and National Law Universities...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom publish checkbox */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
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

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
                <div className="text-[11px] text-slate-400">
                  {editingBlog ? `Editing ID: #${editingBlog.id}` : 'Draft will be saved on server'}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowBlogModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBlog || isUploadingImage}
                    className="px-5 py-2 rounded-xl bg-[#89190E] hover:bg-[#70140B] text-white text-xs font-bold shadow-md shadow-[#89190E]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSavingBlog ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingBlog ? 'Update Article' : 'Publish Article'}</span>
                    )}
                  </button>
                </div>
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

