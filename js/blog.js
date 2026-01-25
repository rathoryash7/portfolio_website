/**
 * Blog System - Handles blog listing, search, filtering, and pagination
 */

class BlogSystem {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.postsPerPage = 6;
        this.currentCategory = 'all';
        this.currentTag = 'all';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        await this.loadPosts();
        this.renderPosts();
        this.setupEventListeners();
        this.updateURL();
    }

    async loadPosts() {
        try {
            const response = await fetch('data/blog-posts.json');
            this.posts = await response.json();
            this.filteredPosts = [...this.posts];
            this.sortPostsByDate();
        } catch (error) {
            console.error('Error loading blog posts:', error);
            this.posts = [];
            this.filteredPosts = [];
        }
    }

    sortPostsByDate() {
        this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterPosts();
            });
        }

        // Category filter
        const categoryButtons = document.querySelectorAll('.blog-category-filter');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentCategory = btn.dataset.category || 'all';
                this.updateActiveFilter(btn, categoryButtons);
                this.filterPosts();
            });
        });

        // Tag filter
        const tagButtons = document.querySelectorAll('.blog-tag-filter');
        tagButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentTag = btn.dataset.tag || 'all';
                this.updateActiveFilter(btn, tagButtons);
                this.filterPosts();
            });
        });

        // Pagination
        const paginationLinks = document.querySelectorAll('.pgn__num, .pgn__prev, .pgn__next');
        paginationLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (link.classList.contains('pgn__prev')) {
                    this.goToPage(this.currentPage - 1);
                } else if (link.classList.contains('pgn__next')) {
                    this.goToPage(this.currentPage + 1);
                } else if (!link.classList.contains('dots')) {
                    this.goToPage(parseInt(link.textContent));
                }
            });
        });
    }

    updateActiveFilter(activeBtn, allButtons) {
        allButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    filterPosts() {
        this.filteredPosts = this.posts.filter(post => {
            // Search filter
            const matchesSearch = !this.searchQuery || 
                post.title.toLowerCase().includes(this.searchQuery) ||
                post.excerpt.toLowerCase().includes(this.searchQuery) ||
                post.content.toLowerCase().includes(this.searchQuery) ||
                post.tags.some(tag => tag.toLowerCase().includes(this.searchQuery));

            // Category filter
            const matchesCategory = this.currentCategory === 'all' || 
                post.category.toLowerCase() === this.currentCategory.toLowerCase();

            // Tag filter
            const matchesTag = this.currentTag === 'all' || 
                post.tags.some(tag => tag.toLowerCase() === this.currentTag.toLowerCase());

            return matchesSearch && matchesCategory && matchesTag;
        });

        this.currentPage = 1;
        this.renderPosts();
        this.updateURL();
    }

    renderPosts() {
        const container = document.getElementById('blog-posts-container');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const postsToShow = this.filteredPosts.slice(startIndex, endIndex);

        if (postsToShow.length === 0) {
            container.innerHTML = `
                <div class="blog-empty-state">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            this.renderPagination();
            return;
        }

        container.innerHTML = postsToShow.map(post => this.createPostCard(post)).join('');
        this.renderPagination();
        this.animatePosts();
    }

    createPostCard(post) {
        const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tagsHTML = post.tags.map(tag => 
            `<a href="#" class="blog-tag" data-tag="${tag.toLowerCase()}">${tag}</a>`
        ).join('');

        return `
            <article class="grid-list-items__item blog-card" data-post-id="${post.id}">
                <div class="blog-card__header">
                    <div class="blog-card__cat-links">
                        <a href="#" class="blog-category-filter" data-category="${post.category.toLowerCase()}">${post.category}</a>
                    </div>
                    <h3 class="blog-card__title">
                        <a href="blog-post.html?slug=${post.slug}">${post.title}</a>
                    </h3>
                </div>
                ${post.coverImage ? `
                    <div class="blog-card__image">
                        <a href="blog-post.html?slug=${post.slug}">
                            <img src="${post.coverImage}" alt="${post.title}" loading="lazy">
                        </a>
                    </div>
                ` : ''}
                <div class="blog-card__text">
                    <p>${post.excerpt}</p>
                </div>
                <div class="blog-card__meta">
                    <span class="blog-card__date">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.5"></circle>
                            <path stroke="currentColor" stroke-width="1.5" d="M12 8V12L14 14"></path>
                        </svg>
                        ${formattedDate}
                    </span>
                    <span class="blog-card__reading-time">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-width="1.5" d="M12 6v6l4 2"></path>
                        </svg>
                        ${post.readingTime} min read
                    </span>
                </div>
                <div class="blog-card__tags">
                    ${tagsHTML}
                </div>
                <div class="blog-card__footer">
                    <a href="blog-post.html?slug=${post.slug}" class="btn btn--stroke">Read More</a>
                    ${post.github ? `<a href="${post.github}" target="_blank" class="btn btn--stroke" rel="noopener noreferrer">View Code</a>` : ''}
                </div>
            </article>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
        const paginationContainer = document.getElementById('blog-pagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav class="pgn"><ul>';
        
        // Previous button
        paginationHTML += `
            <li>
                <a class="pgn__prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                   href="#" ${this.currentPage === 1 ? 'aria-disabled="true"' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M12.707 17.293L8.414 13H18v-2H8.414l4.293-4.293-1.414-1.414L4.586 12l6.707 6.707z"/>
                    </svg>
                </a>
            </li>
        `;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            paginationHTML += '<li><a class="pgn__num" href="#">1</a></li>';
            if (startPage > 2) {
                paginationHTML += '<li><span class="pgn__num dots">…</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li>
                    <a class="pgn__num ${i === this.currentPage ? 'current' : ''}" href="#">
                        ${i}
                    </a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li><span class="pgn__num dots">…</span></li>';
            }
            paginationHTML += `<li><a class="pgn__num" href="#">${totalPages}</a></li>`;
        }

        // Next button
        paginationHTML += `
            <li>
                <a class="pgn__next ${this.currentPage === totalPages ? 'disabled' : ''}" 
                   href="#" ${this.currentPage === totalPages ? 'aria-disabled="true"' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M11.293 17.293l1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586z"/>
                    </svg>
                </a>
            </li>
        `;

        paginationHTML += '</ul></nav>';
        paginationContainer.innerHTML = paginationHTML;

        // Re-attach event listeners
        this.setupEventListeners();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderPosts();
        this.updateURL();
        
        // Scroll to top of blog section
        const blogSection = document.getElementById('blog-posts-container');
        if (blogSection) {
            blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    animatePosts() {
        const cards = document.querySelectorAll('.blog-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    updateURL() {
        const params = new URLSearchParams();
        if (this.currentPage > 1) params.set('page', this.currentPage);
        if (this.currentCategory !== 'all') params.set('category', this.currentCategory);
        if (this.currentTag !== 'all') params.set('tag', this.currentTag);
        if (this.searchQuery) params.set('search', this.searchQuery);
        
        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newURL);
    }

    // Get all unique categories
    getCategories() {
        const categories = new Set(this.posts.map(post => post.category));
        return Array.from(categories).sort();
    }

    // Get all unique tags
    getTags() {
        const tags = new Set();
        this.posts.forEach(post => {
            post.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }
}

// Initialize blog system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('blog-posts-container')) {
            window.blogSystem = new BlogSystem();
        }
    });
} else {
    if (document.getElementById('blog-posts-container')) {
        window.blogSystem = new BlogSystem();
    }
}

