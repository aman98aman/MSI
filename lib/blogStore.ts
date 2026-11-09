import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from './mongodb';

export interface GazetteArticle {
  id: number | string;
  slug: string;
  title: string;
  category: 'judiciary' | 'jurisprudence' | 'clat' | 'all' | 'pu-law' | 'legal-insights' | string;
  categoryLabel: string;
  date: string;
  readTime: string;
  excerpt: string;
  author: string;
  authorRole: string;
  avatar: string;
  accentColor: string;
  badge?: string;
  initialClaps?: number;
  keyTakeaways: string[];
  statutesCited: string[];
  fullSummary: string;
  content?: string;
  coverImage?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const DELETED_BLOGS_FILE = path.join(DATA_DIR, 'deleted_blogs.json');

const INITIAL_ARTICLES: GazetteArticle[] = [
  {
    id: 1,
    slug: 'cracking-pcs-judicial-services-strategy',
    title: 'Cracking PCS (Judicial Services): Strategy, Judgment Writing & High Court Precedents',
    category: 'judiciary',
    categoryLabel: 'Judicial Services',
    date: 'September 2026',
    readTime: '6 min read',
    excerpt:
      'A systematic roadmap for mastering Civil Procedure, Criminal Law, BNSS 2023, and scoring high in Mains judgment writing.',
    author: 'Adv. Rajesh Kumar',
    authorRole: 'Head — Judiciary & PCS J Division',
    avatar: '/images/avatars/avatar-3.webp',
    accentColor: '#89190E',
    badge: 'Trending #1 in Punjab PCS-J',
    initialClaps: 248,
    keyTakeaways: [
      'Master procedural transitions under the newly enacted Bharatiya Nagarik Suraksha Sanhita (BNSS 2023).',
      'Judicial framing of issues in Civil cases & framing of charges in Criminal trials with exact statutory citation.',
      'Three-tier evaluation framework for appraisal of witness testimony and electronic evidence (BSA Sec 63).',
    ],
    statutesCited: ['BNSS 2023 § 173', 'CPC 1908 Order XIV', 'BSA 2023 § 63', 'Constitution Art. 235'],
    fullSummary:
      'Success in State Judicial Services examinations demands far more than verbatim memorization of bare acts. In this comprehensive dispatch, Adv. Rajesh Kumar breaks down the analytical doctrine needed to clear the Punjab and Haryana High Court Judicial Mains examinations.',
    isPublished: true,
  },
  {
    id: 2,
    slug: 'national-moot-court-victory-msi-law-delegation',
    title: 'National Moot Court Victory: MSI Law Delegation Triumphs on Constitutional Rights',
    category: 'jurisprudence',
    categoryLabel: 'Legal Jurisprudence',
    date: 'August 2026',
    readTime: '6 min read',
    excerpt:
      'An inside look at our integrated law students formulating appellate arguments before a simulated 5-judge Supreme Court bench.',
    author: 'Dr. Ekta Gahlawat',
    authorRole: 'Faculty – Legal Studies, MSI',
    avatar: '/images/avatars/avatar-2.webp',
    accentColor: '#10233F',
    badge: 'National Champions 2026',
    initialClaps: 312,
    keyTakeaways: [
      'Framing appellate questions of law concerning data privacy vs. statutory surveillance doctrines.',
      'Adherence to Harvard Bluebook & Indian Law Institute (ILI) citation protocols in winning memorials.',
    ],
    statutesCited: ['Constitution Art. 21', 'Constitution Art. 32', 'DPDP Act 2023 § 4'],
    fullSummary:
      'The MSI Group of Institutes Law delegation recently clinched top honours at the 14th National Constitutional Law Moot Court Competition.',
    isPublished: true,
  },
  {
    id: 3,
    slug: 'mastering-clat-passage-based-reasoning-gk',
    title: 'Mastering CLAT & PU Law Entrance: Tackling Passage-Based Reasoning & Current Affairs',
    category: 'clat',
    categoryLabel: 'Law Entrance',
    date: 'August 2026',
    readTime: '5 min read',
    excerpt:
      'Proven test strategies for scoring high in Critical Reasoning, Passage Mapping, and Static GK for NLU and Panjab University admissions.',
    author: 'Ms. Riya Hooda',
    authorRole: 'Faculty – Logical Reasoning',
    avatar: '/images/avatars/avatar-5.webp',
    accentColor: '#89190E',
    badge: 'High-Yield Entrance Guide',
    initialClaps: 189,
    keyTakeaways: [
      'Rapid passage mapping to isolate premises, counter-premises, and conclusion in under 75 seconds.',
      'Eliminating seductive answer traps in Legal Reasoning.',
    ],
    statutesCited: ['Law of Torts', 'Indian Contract Act § 56'],
    fullSummary:
      'The modern CLAT paper rewards rapid analytical comprehension over rote memory. Ms. Riya Hooda shares the proprietary MSI reading method.',
    isPublished: true,
  },
  {
    id: 4,
    slug: 'the-new-criminal-laws-bns-bnss-bsa-aspirants',
    title: 'The New Criminal Laws (BNS, BNSS, BSA 2023): Critical Shifts Judicial Aspirants Must Know',
    category: 'judiciary',
    categoryLabel: 'Judicial Services',
    date: 'July 2026',
    readTime: '7 min read',
    excerpt:
      'Examining key statutory shifts from IPC, CrPC, and Indian Evidence Act to the newly enacted Bharatiya Sanhitas.',
    author: 'Dr. Vikramaditya Sharma',
    authorRole: 'Senior Professor of Procedural Law',
    avatar: '/images/avatars/avatar-4.webp',
    accentColor: '#10233F',
    badge: 'Syllabus Core',
    initialClaps: 421,
    keyTakeaways: [
      'Detailed cross-reference comparative table mapping IPC provisions to Bharatiya Nyaya Sanhita (BNS).',
      'Electronic evidence admissibility mandatory timelines.',
    ],
    statutesCited: ['BNS 2023 § 103', 'BNSS 2023 § 107', 'BSA 2023 § 63(4)'],
    fullSummary:
      'The replacement of legacy British-era criminal codes by Bharatiya Nyaya Sanhita, BNSS, and BSA represents a massive transformation.',
    isPublished: true,
  },
];

export function readDeletedBlogsFromDisk(): string[] {
  try {
    if (fs.existsSync(DELETED_BLOGS_FILE)) {
      const raw = fs.readFileSync(DELETED_BLOGS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).toLowerCase().trim());
        }
      }
    }
    return [];
  } catch (err) {
    console.warn('[BlogStore] Error reading deleted blogs list:', err);
    return [];
  }
}

export function markBlogDeletedOnDisk(identifier: string): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readDeletedBlogsFromDisk();
    const clean = String(identifier).toLowerCase().trim();
    if (!current.includes(clean)) {
      current.push(clean);
      fs.writeFileSync(DELETED_BLOGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[BlogStore] Error saving deleted blog identifier:', err);
  }
}

export function readBlogsFromDisk(): GazetteArticle[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const deletedIds = readDeletedBlogsFromDisk();

    if (fs.existsSync(BLOGS_FILE)) {
      const raw = fs.readFileSync(BLOGS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed: GazetteArticle[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (b) =>
              !deletedIds.includes(String(b.id).toLowerCase().trim()) &&
              !deletedIds.includes(String(b.slug).toLowerCase().trim())
          );
        }
      }
    }

    const initial = INITIAL_ARTICLES.filter(
      (b) =>
        !deletedIds.includes(String(b.id).toLowerCase().trim()) &&
        !deletedIds.includes(String(b.slug).toLowerCase().trim())
    );
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  } catch (err) {
    console.error('[BlogStore] Error reading blogs from disk:', err);
    return [];
  }
}

export function writeBlogsToDisk(blogs: GazetteArticle[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[BlogStore] Error writing blogs to disk:', err);
  }
}

export async function getBlogsAsync(includeUnpublished = false): Promise<GazetteArticle[]> {
  const diskBlogs = readBlogsFromDisk();
  const deletedIds = readDeletedBlogsFromDisk();

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      const mongoDocs = await db.collection('blogs').find({}).toArray();

      if (mongoDocs && mongoDocs.length > 0) {
        const mapped: GazetteArticle[] = mongoDocs.map((doc: any) => ({
          id: doc.id || doc._id?.toString(),
          slug: doc.slug || `article-${doc.id}`,
          title: doc.title || '',
          category: doc.category || 'judiciary',
          categoryLabel: doc.categoryLabel || 'Judicial Services',
          date: doc.date || 'Recent',
          readTime: doc.readTime || '5 min read',
          excerpt: doc.excerpt || '',
          author: doc.author || 'MSI Faculty',
          authorRole: doc.authorRole || 'Faculty Member',
          avatar: doc.avatar || '/images/avatars/avatar-1.webp',
          accentColor: doc.accentColor || '#89190E',
          badge: doc.badge,
          initialClaps: doc.initialClaps || 0,
          keyTakeaways: Array.isArray(doc.keyTakeaways) ? doc.keyTakeaways : [],
          statutesCited: Array.isArray(doc.statutesCited) ? doc.statutesCited : [],
          fullSummary: doc.fullSummary || doc.excerpt || '',
          content: doc.content || doc.fullSummary || '',
          coverImage: doc.coverImage,
          isPublished: doc.isPublished !== false,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));

        const filtered = mapped.filter(
          (b) =>
            !deletedIds.includes(String(b.id).toLowerCase().trim()) &&
            !deletedIds.includes(String(b.slug).toLowerCase().trim())
        );

        writeBlogsToDisk(filtered);
        return includeUnpublished ? filtered : filtered.filter((b) => b.isPublished !== false);
      }
    } catch (err) {
      console.warn('[BlogStore] Mongo read failed, falling back to disk:', err);
    }
  }

  return includeUnpublished ? diskBlogs : diskBlogs.filter((b) => b.isPublished !== false);
}

export async function addBlogAsync(
  article: Partial<GazetteArticle>
): Promise<GazetteArticle> {
  const newId = Date.now();
  const rawTitle = article.title?.trim() || 'Untitled Article';
  const slug =
    article.slug?.trim() ||
    rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const newArticle: GazetteArticle = {
    id: newId,
    slug,
    title: rawTitle,
    category: article.category || 'judiciary',
    categoryLabel: article.categoryLabel || 'Judicial Services',
    date: article.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    readTime: article.readTime || '5 min read',
    excerpt: article.excerpt?.trim() || '',
    author: article.author?.trim() || 'MSI Faculty',
    authorRole: article.authorRole?.trim() || 'Faculty of Law',
    avatar: article.avatar || '/images/avatars/avatar-1.webp',
    accentColor: article.accentColor || '#89190E',
    badge: article.badge,
    initialClaps: article.initialClaps || 50,
    keyTakeaways: article.keyTakeaways || [],
    statutesCited: article.statutesCited || [],
    fullSummary: article.fullSummary?.trim() || article.content?.trim() || article.excerpt?.trim() || '',
    content: article.content?.trim() || article.fullSummary?.trim() || '',
    coverImage: article.coverImage,
    isPublished: article.isPublished !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const blogs = readBlogsFromDisk();
  const updated = [newArticle, ...blogs];
  writeBlogsToDisk(updated);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('blogs').insertOne(newArticle);
    } catch (err) {
      console.warn('[BlogStore] Mongo insert failed:', err);
    }
  }

  return newArticle;
}

export async function updateBlogAsync(
  id: number | string,
  updates: Partial<GazetteArticle>
): Promise<GazetteArticle | null> {
  const blogs = readBlogsFromDisk();
  const strId = String(id).trim();
  const idx = blogs.findIndex((b) => String(b.id).trim() === strId || b.slug === strId);
  if (idx === -1) return null;

  const current = blogs[idx];
  const updated: GazetteArticle = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };

  blogs[idx] = updated;
  writeBlogsToDisk(blogs);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('blogs').updateOne(
        { $or: [{ id: current.id }, { slug: current.slug }] },
        { $set: updated }
      );
    } catch (err) {
      console.warn('[BlogStore] Mongo update failed:', err);
    }
  }

  return updated;
}

export async function deleteBlogAsync(identifier: number | string): Promise<boolean> {
  const clean = String(identifier).toLowerCase().trim();
  markBlogDeletedOnDisk(clean);

  const blogs = readBlogsFromDisk();
  const filtered = blogs.filter(
    (b) => String(b.id).toLowerCase().trim() !== clean && String(b.slug).toLowerCase().trim() !== clean
  );
  writeBlogsToDisk(filtered);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('blogs').deleteMany({
        $or: [
          { id: identifier },
          { id: typeof identifier === 'string' ? Number(identifier) || identifier : identifier },
          { slug: clean },
        ],
      });
    } catch (err) {
      console.warn('[BlogStore] Mongo delete failed:', err);
    }
  }

  return true;
}

