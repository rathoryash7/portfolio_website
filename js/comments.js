/**
 * Comment System - Handles comments for blog posts
 * Uses localStorage for now, but can be easily adapted for API integration
 */

class CommentSystem {
    constructor() {
        this.postSlug = this.getPostSlug();
        this.comments = [];
        this.init();
    }

    getPostSlug() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug');
    }

    init() {
        if (!this.postSlug) return;

        this.loadComments();
        this.renderComments();
        this.setupForm();
    }

    loadComments() {
        try {
            const stored = localStorage.getItem(`comments_${this.postSlug}`);
            if (stored) {
                this.comments = JSON.parse(stored);
                // Filter out unapproved comments (for moderation)
                this.comments = this.comments.filter(c => c.approved !== false);
                // Sort by date (newest first)
                this.comments.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.comments = [];
        }
    }

    saveComments() {
        try {
            localStorage.setItem(`comments_${this.postSlug}`, JSON.stringify(this.comments));
        } catch (error) {
            console.error('Error saving comments:', error);
        }
    }

    setupForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComment(form);
        });
    }

    submitComment(form) {
        const statusEl = document.getElementById('comment-form-status');
        const name = form.querySelector('#comment-name').value.trim();
        const email = form.querySelector('#comment-email').value.trim();
        const website = form.querySelector('#comment-website').value.trim();
        const message = form.querySelector('#comment-message').value.trim();

        // Basic validation
        if (!name || !email || !message) {
            this.showStatus('Please fill in all required fields.', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showStatus('Please enter a valid email address.', 'error');
            return;
        }

        // Basic spam protection - check for common spam patterns
        if (this.isSpam(message, name, email)) {
            this.showStatus('Your comment appears to be spam. Please try again.', 'error');
            return;
        }

        // Create comment object
        const comment = {
            id: Date.now().toString(),
            postSlug: this.postSlug,
            name: this.sanitizeInput(name),
            email: this.sanitizeInput(email),
            website: website ? this.sanitizeInput(website) : '',
            message: this.sanitizeInput(message),
            date: new Date().toISOString(),
            approved: true, // Set to false for moderation, or implement admin approval
            notify: form.querySelector('#comment-notify').checked
        };

        // Add comment
        this.comments.unshift(comment);
        this.saveComments();
        this.renderComments();

        // Reset form
        form.reset();
        this.showStatus('Thank you! Your comment has been posted.', 'success');

        // Scroll to comment
        setTimeout(() => {
            const commentEl = document.querySelector(`[data-comment-id="${comment.id}"]`);
            if (commentEl) {
                commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    isSpam(message, name, email) {
        // Basic spam detection patterns
        const spamPatterns = [
            /http[s]?:\/\/[^\s]{4,}/gi, // Multiple URLs
            /[A-Z]{10,}/g, // Excessive caps
            /(.)\1{4,}/g, // Repeated characters
        ];

        const combined = `${message} ${name} ${email}`.toLowerCase();
        
        // Check for spam keywords (basic list)
        const spamKeywords = ['viagra', 'casino', 'poker', 'loan', 'debt'];
        if (spamKeywords.some(keyword => combined.includes(keyword))) {
            return true;
        }

        // Check for spam patterns
        return spamPatterns.some(pattern => pattern.test(combined));
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('comment-form-status');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `form-status ${type}`;
        statusEl.setAttribute('role', 'alert');

        if (type === 'success') {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'form-status';
                statusEl.removeAttribute('role');
            }, 5000);
        }
    }

    renderComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;

        if (this.comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = this.comments.map(comment => this.createCommentHTML(comment)).join('');
    }

    createCommentHTML(comment) {
        const formattedDate = new Date(comment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const websiteLink = comment.website ? 
            `<a href="${comment.website}" target="_blank" rel="noopener noreferrer" class="comment-website">${comment.website}</a>` : 
            '';

        return `
            <article class="comment" data-comment-id="${comment.id}">
                <div class="comment__avatar">
                    <div class="avatar-placeholder">
                        ${comment.name.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div class="comment__content">
                    <div class="comment__header">
                        <cite class="comment__author">
                            <strong>${comment.name}</strong>
                            ${websiteLink}
                        </cite>
                        <time class="comment__date" datetime="${comment.date}">
                            ${formattedDate}
                        </time>
                    </div>
                    <div class="comment__text">
                        ${this.formatCommentText(comment.message)}
                    </div>
                </div>
            </article>
        `;
    }

    formatCommentText(text) {
        // Convert line breaks to <br>
        return text
            .replace(/\n/g, '<br>')
            .replace(/&lt;(\/?(?:a|strong|em|code|pre|blockquote))/gi, '<$1')
            .replace(/&lt;/g, '&amp;lt;')
            .replace(/&gt;/g, '&amp;gt;');
    }
}

// Initialize comment system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('comments-section')) {
            window.commentSystem = new CommentSystem();
        }
    });
} else {
    if (document.getElementById('comments-section')) {
        window.commentSystem = new CommentSystem();
    }
}


