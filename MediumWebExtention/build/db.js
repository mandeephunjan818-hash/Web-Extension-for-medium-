// db.js - Must use static export syntax

class MediumDB {
    constructor() {
        this.dbName = 'MediumExtensionDB';
        this.version = 1;
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ Database opened');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // ARTICLES
                if (!db.objectStoreNames.contains("articles")) {
                    const store = db.createObjectStore("articles", {
                        keyPath: "ArticalUrl" // ✅ stable unique key
                    });
                    store.createIndex("lastVisitedAt", "lastVisitedAt", { unique: false });
                    store.createIndex("publishDate", "ArticalDate", { unique: false });
                    store.createIndex("articalReadTime", "ArticalReadTime", { unique: false });
                    store.createIndex("aticalTitle", "ArticalTitle", { unique: false });
                    store.createIndex("visitCount", "visitCount", { unique: false });
                }

                // AUTHORS
                if (!db.objectStoreNames.contains("authors")) {
                    const store = db.createObjectStore("authors", {
                        keyPath: "AutherUrl" // ✅ stable unique key
                    });
                    store.createIndex("name", "AutherName", { unique: false });
                    store.createIndex("imageUrl", "AutherImage", { unique: false });
                    store.createIndex("isFollowing", "isFollowing", { unique: false });
                    store.createIndex("followedAt", "followedAt", { unique: false });
                }

                // EVENTS (history)
                if (!db.objectStoreNames.contains("events")) {
                    const store = db.createObjectStore("events", {
                        keyPath: "id",
                        autoIncrement: true
                    });
                    store.createIndex("authorProfileUrl", "AuthorUrl", { unique: false });
                    store.createIndex("articleUrl", "ArticalUrl", { unique: false });
                    store.createIndex("timestamp", "timestamp", { unique: false });
                }

                console.log("📊 Database schema created/updated");
            };
        });
    }

    async CheckAuthorPresenc(url) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(["authors", "events"], "readwrite");
            const authorsStore = tx.objectStore("authors");

            const getReq = authorsStore.get(url);

            getReq.onsuccess = () => {
                const existing = getReq.result;

                if (existing) {
                    resolve({ message: "Auther is alredy present in the DB", result: false });
                } else {
                    resolve({ message: "Auther is not present in the DB", result: true });
                }
            };

            getReq.onerror = () => reject({ message: "Cannot check author presence", result: false });
        });
    }

    async CheckArticlePresenc(url) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(["articles", "events"], "readwrite");
            const store = tx.objectStore("articles");

            const getReq = store.get(url);

            getReq.onsuccess = () => {
                const existing = getReq.result;

                if (existing) {
                    resolve({
                        result: false,
                        message: "Article already exists",
                        data: (existing.visitCount || 0) + 1,
                    });
                } else {
                    resolve({
                        result: true,
                        message: "Article not found",
                        data: 1,
                    });
                }
            };

            getReq.onerror = () => reject({ message: "Article is not present in the DB", result: false, data: 0 });
        });
    }

    async saveAuther(autherData) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['authors'], 'readwrite');
            const store = transaction.objectStore('authors');

            const request = store.add(autherData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async saveArticle(articleData) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles'], 'readwrite');
            const store = transaction.objectStore('articles');

            const request = store.add(articleData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async updateArticleVisitCount(url, visitCount) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles'], 'readwrite');
            const store = transaction.objectStore('articles');

            const getReq = store.get(url);

            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (existing) {
                    existing.visitCount = visitCount;
                    const putReq = store.put(existing);
                    putReq.onsuccess = () => resolve({ message: "Article visit count updated", result: true, data: existing });
                } else {
                    reject({ message: "Article not found", result: false });
                }
            };

            getReq.onerror = () => reject({ message: "Error fetching article", result: false });
        });
    }

    async saveEvent(items) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles', 'events'], 'readwrite');
            const store = transaction.objectStore('events');

            const eventData = {
                AuthorUrl: items.Auther.AutherUrl,
                ArticalUrl: items.Artical.ArticalUrl,
                timestamp: new Date().toISOString()
            }
            const request = store.add(eventData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllAuthors(limit = 100) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['authors'], 'readonly');
            const store = transaction.objectStore('authors');
            const request = store.getAll();

            request.onsuccess = () => {
                const authors = request.result.slice(0, limit);
                resolve(authors);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllArticles(limit = 50) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles'], 'readonly');
            const store = transaction.objectStore('articles');
            const request = store.getAll();

            request.onsuccess = () => {
                const articles = request.result.slice(0, limit);
                resolve(articles);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllEvents(limit = 200) {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readonly');
            const store = transaction.objectStore('events');
            const request = store.getAll();

            request.onsuccess = () => {
                const events = request.result.slice(0, limit);
                resolve(events);
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getStats() {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles', 'authors'], 'readonly');
            const articlesStore = transaction.objectStore('articles');
            const authorsStore = transaction.objectStore('authors');

            // Helper to promisify IDBRequests
            const promisify = (request) => new Promise((res, rej) => {
                request.onsuccess = () => res(request.result);
                request.onerror = () => rej(request.error);
            });

            Promise.all([
                promisify(articlesStore.count()),
                promisify(authorsStore.count())
            ])
                .then(([articleCount, authorCount]) => {
                    resolve({ articleCount, authorCount });
                })
                .catch(reject);
        });
    }

    async clearAll() {
        if (!this.db) await this.open();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['articles', 'authors'], 'readwrite');

            transaction.objectStore('articles').clear();
            transaction.objectStore('authors').clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    }
}

// ✅ Use default export for ES6 modules
export default MediumDB;