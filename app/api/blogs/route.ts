import { NextRequest, NextResponse } from 'next/server';
import {
  getBlogsAsync,
  addBlogAsync,
  updateBlogAsync,
  deleteBlogAsync,
  GazetteArticle,
} from '@/lib/blogStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeUnpublished = url.searchParams.get('all') === 'true';

    const blogs = await getBlogsAsync(includeUnpublished);
    return NextResponse.json({ success: true, blogs });
  } catch (err: any) {
    console.error('Error fetching blogs:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, excerpt, content, category, categoryLabel, author, authorRole, coverImage, readTime, isPublished } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Blog title is required' },
        { status: 400 }
      );
    }

    const created = await addBlogAsync({
      title,
      excerpt: excerpt || '',
      content: content || '',
      fullSummary: content || excerpt || '',
      category: category || 'judiciary',
      categoryLabel: categoryLabel || 'Judicial Services',
      author: author || 'MSI Faculty',
      authorRole: authorRole || 'Legal Academic Panel',
      coverImage: coverImage || '',
      readTime: readTime || '5 min read',
      isPublished: isPublished !== false,
    });

    const updatedList = await getBlogsAsync(true);
    return NextResponse.json({
      success: true,
      blog: created,
      blogs: updatedList,
      message: 'Article published successfully!',
    });
  } catch (err: any) {
    console.error('Error adding blog post:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, excerpt, content, category, categoryLabel, author, authorRole, coverImage, readTime, isPublished } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Blog ID is required for update' },
        { status: 400 }
      );
    }

    const updates: Partial<GazetteArticle> = {};
    if (title !== undefined) updates.title = title.trim();
    if (excerpt !== undefined) updates.excerpt = excerpt.trim();
    if (content !== undefined) {
      updates.content = content.trim();
      updates.fullSummary = content.trim();
    }
    if (category !== undefined) updates.category = category;
    if (categoryLabel !== undefined) updates.categoryLabel = categoryLabel;
    if (author !== undefined) updates.author = author.trim();
    if (authorRole !== undefined) updates.authorRole = authorRole.trim();
    if (coverImage !== undefined) updates.coverImage = coverImage;
    if (readTime !== undefined) updates.readTime = readTime;
    if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);

    const updated = await updateBlogAsync(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      );
    }

    const updatedList = await getBlogsAsync(true);
    return NextResponse.json({
      success: true,
      blog: updated,
      blogs: updatedList,
      message: 'Article updated successfully!',
    });
  } catch (err: any) {
    console.error('Error updating blog post:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryId = url.searchParams.get('id');

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {}

    const idsToDelete: Array<string | number> = [];
    if (queryId) idsToDelete.push(queryId);
    if (body.id) idsToDelete.push(body.id);
    if (Array.isArray(body.ids)) {
      body.ids.forEach((i: any) => idsToDelete.push(i));
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No blog ID(s) provided for deletion' },
        { status: 400 }
      );
    }

    for (const id of idsToDelete) {
      await deleteBlogAsync(id);
    }

    const updatedList = await getBlogsAsync(true);
    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      blogs: updatedList,
      message: `${idsToDelete.length} article(s) permanently deleted`,
    });
  } catch (err: any) {
    console.error('Error deleting blog:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to delete blog' },
      { status: 500 }
    );
  }
}

