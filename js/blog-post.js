/**
 * Blog Post Page - Handles individual blog post rendering
 */

class BlogPost {
    constructor() {
        this.post = null;
        this.allPosts = [];
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            this.showError('Post not found');
            return;
        }

        await this.loadPost(slug);
        if (this.post) {
            this.renderPost();
            this.updateMetaTags();
        }
    }

    async loadPost(slug) {
        try {
            const response = await fetch('data/blog-posts.json');
            this.allPosts = await response.json();
            this.post = this.allPosts.find(p => p.slug === slug);

            if (!this.post) {
                this.showError('Post not found');
            }
        } catch (error) {
            console.error('Error loading blog post:', error);
            this.showError('Error loading post');
        }
    }

    renderPost() {
        // Render title
        const titleEl = document.getElementById('blog-post-title');
        if (titleEl) {
            titleEl.textContent = this.post.title;
        }

        // Render meta
        const metaEl = document.getElementById('blog-post-meta');
        if (metaEl) {
            const formattedDate = new Date(this.post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            metaEl.innerHTML = `
                <div class="entry__meta-date">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.5"></circle>
                        <path stroke="currentColor" stroke-width="1.5" d="M12 8V12L14 14"></path>
                    </svg>
                    ${formattedDate}
                </div>
                <div class="entry__meta-cat">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 17.25V9.75C19.25 8.64543 18.3546 7.75 17.25 7.75H4.75V17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H17.25C18.3546 19.25 19.25 18.3546 19.25 17.25Z"></path>
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 7.5L12.5685 5.7923C12.2181 5.14977 11.5446 4.75 10.8127 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V11"></path>
                    </svg>
                    <span class="cat-links">
                        <a href="blog.html?category=${this.post.category.toLowerCase()}">${this.post.category}</a>
                    </span>
                </div>
                <div class="entry__meta-reading-time">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke="currentColor" stroke-width="1.5" d="M12 6v6l4 2"></path>
                    </svg>
                    ${this.post.readingTime} min read
                </div>
            `;
        }

        // Render cover image
        const imageEl = document.getElementById('blog-post-image');
        if (imageEl && this.post.coverImage) {
            imageEl.innerHTML = `
                <div class="column xl-12">
                    <figure class="featured-image">
                        <img src="${this.post.coverImage}" 
                             alt="${this.post.title}" 
                             loading="eager"
                             style="width: 100%; height: auto; border-radius: 8px;">
                    </figure>
                </div>
            `;
        }

        // Render content
        const contentEl = document.getElementById('blog-post-content');
        if (contentEl) {
            // Configure marked for markdown rendering
            marked.setOptions({
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {}
                    }
                    return hljs.highlightAuto(code).value;
                },
                breaks: true,
                gfm: true
            });

            // Render markdown
            const html = marked.parse(this.post.content);
            contentEl.innerHTML = html;

            // Highlight code blocks
            contentEl.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        // Render tags
        const tagsEl = document.getElementById('blog-post-tags');
        if (tagsEl && this.post.tags) {
            const tagsHTML = this.post.tags.map(tag => 
                `<a href="blog.html?tag=${tag.toLowerCase()}" class="blog-tag">${tag}</a>`
            ).join('');
            tagsEl.innerHTML = `<div class="blog-tags-container">${tagsHTML}</div>`;
        }

        // Render navigation
        this.renderNavigation();
    }

    renderNavigation() {
        const currentIndex = this.allPosts.findIndex(p => p.id === this.post.id);
        const prevPost = currentIndex > 0 ? this.allPosts[currentIndex - 1] : null;
        const nextPost = currentIndex < this.allPosts.length - 1 ? this.allPosts[currentIndex + 1] : null;

        const navEl = document.getElementById('blog-post-nav');
        if (navEl) {
            let navHTML = '<div class="post-nav">';
            
            if (prevPost) {
                navHTML += `
                    <div class="post-nav__prev">
                        <a href="blog-post.html?slug=${prevPost.slug}" rel="prev">
                            <span>Previous</span>
                            ${prevPost.title}
                        </a>
                    </div>
                `;
            } else {
                navHTML += '<div class="post-nav__prev"></div>';
            }

            if (nextPost) {
                navHTML += `
                    <div class="post-nav__next">
                        <a href="blog-post.html?slug=${nextPost.slug}" rel="next">
                            <span>Next</span>
                            ${nextPost.title}
                        </a>
                    </div>
                `;
            } else {
                navHTML += '<div class="post-nav__next"></div>';
            }

            navHTML += '</div>';
            navEl.innerHTML = navHTML;
        }
    }

    updateMetaTags() {
        // Update page title
        document.title = `${this.post.title} - Yash Rathor`;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = this.post.excerpt;

        // Update Open Graph tags
        this.updateOGTag('og:title', this.post.title);
        this.updateOGTag('og:description', this.post.excerpt);
        if (this.post.coverImage) {
            this.updateOGTag('og:image', new URL(this.post.coverImage, window.location.origin).href);
        }
        this.updateOGTag('og:type', 'article');
        this.updateOGTag('og:url', window.location.href);
    }

    updateOGTag(property, content) {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    showError(message) {
        const contentEl = document.getElementById('blog-post-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="blog-error">
                    <h2>${message}</h2>
                    <p><a href="blog.html">Return to blog</a></p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blogPost = new BlogPost();
    });
} else {
    window.blogPost = new BlogPost();
}

