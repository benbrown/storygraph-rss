require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const RSS = require('rss');
const fs = require('fs').promises;

// Configuration from environment variables
const STORYGRAPH_USER = process.env.STORYGRAPH_USER;
const OUTPUT_FILE = process.env.OUTPUT_FILE;
const SESSION_COOKIE = process.env.SESSION_COOKIE;
const FEED_TITLE = process.env.FEED_TITLE;
const FEED_DESCRIPTION = process.env.FEED_DESCRIPTION;
const FEED_URL = process.env.FEED_URL;
const FEED_SITE_URL = process.env.FEED_SITE_URL;

// Validate required environment variables
if (!STORYGRAPH_USER || !OUTPUT_FILE || !SESSION_COOKIE || 
    !FEED_TITLE || !FEED_DESCRIPTION || !FEED_URL || !FEED_SITE_URL) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

// Create axios instance with default config
const axiosInstance = axios.create({
    headers: {
        'Cookie': SESSION_COOKIE
    }
});

async function getTotalBooks() {
    const response = await axiosInstance.get(`https://app.thestorygraph.com/books-read/${STORYGRAPH_USER}`);
    const $ = cheerio.load(response.data);
    
    // Find the total books count from the page using the correct selector
    const totalText = $('.search-results-count').text();
    const match = totalText.match(/(\d+)\s+books/);
    return match ? parseInt(match[1]) : 0;
}

async function fetchBooksPage(page) {
    const response = await axiosInstance.get(`https://app.thestorygraph.com/books-read/${STORYGRAPH_USER}?page=${page}`);
    const $ = cheerio.load(response.data);
    const books = [];

    // Find all book entries on the page
    $('.book-pane-content').each((_, element) => {
        const $book = $(element);
        
        // Get title and author from the image alt tag
        const imgAlt = $book.find('.cover-image-column img').attr('alt');
        const [title, author] = imgAlt.split(' by ');
        
        // Get the cover image URL
        const imageUrl = $book.find('.cover-image-column img').attr('src');
        
        // Get the finished date from the action menu, removing the "click to edit read date" text
        const dateText = $book.find('.action-menu a p').first().text().trim();
        const finishedDate = dateText.replace('Finished ', '').replace('Click to edit read date', '').trim();

        // Only include books that have a valid read date
        if (title && author && finishedDate && !finishedDate.includes('No read date')) {
            books.push({
                title,
                author,
                imageUrl,
                finishedDate
            });
        }
    });

    return books;
}

async function generateRSSFeed() {
    const feed = new RSS({
        title: FEED_TITLE,
        description: FEED_DESCRIPTION,
        feed_url: FEED_URL,
        site_url: FEED_SITE_URL,
        language: "en",
        pubDate: new Date()
    });

    try {
        const totalBooks = await getTotalBooks();
        if (!totalBooks) {
            throw new Error('Could not determine total number of books');
        }

        const booksPerPage = 10; // Adjust if needed
        const totalPages = Math.ceil(totalBooks / booksPerPage);

        console.log(`Found ${totalBooks} books across ${totalPages} pages`);

        // Track unique books by title and author
        const uniqueBooks = new Map();

        for (let page = 1; page <= totalPages; page++) {
            console.log(`Fetching page ${page}...`);
            try {
                const books = await fetchBooksPage(page);
                
                books.forEach(book => {
                    // Create a unique key for the book
                    const key = `${book.title}|${book.author}`;
                    
                    // Only add the book if we haven't seen it before
                    if (!uniqueBooks.has(key)) {
                        // Create date at noon CST
                        const date = new Date(book.finishedDate);
                        date.setHours(12, 0, 0, 0); // Set to noon
                        date.setHours(date.getHours() - 6); // Adjust for CST (UTC-6)

                        feed.item({
                            title: `Finished ${book.title} by ${book.author}`,
                            description: `I read ${book.title} by ${book.author}.`,
                            url: `https://app.thestorygraph.com/books-read/${STORYGRAPH_USER}`,
                            date: date,
                            guid: `${book.title}-${book.author}-${book.finishedDate}`,
                            enclosure: {
                                url: book.imageUrl,
                                type: 'image/jpeg',
                                title: `${book.title} cover`
                            }
                        });

                        // Mark this book as seen
                        uniqueBooks.set(key, true);
                    } else {
                        console.log(`Skipping duplicate book: ${book.title} by ${book.author}`);
                    }
                });
            } catch (error) {
                console.error(`Error fetching page ${page}:`, error.message);
                throw error; // Re-throw to trigger the outer catch block
            }
        }

        // Only write the feed if we successfully processed all pages
        const xml = feed.xml({ indent: true });
        await fs.writeFile(OUTPUT_FILE, xml);
        console.log(`RSS feed generated and saved to ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Failed to generate feed:', error.message);
        process.exit(1); // Exit with error code to indicate failure
    }
}

// Run the script
generateRSSFeed().catch(console.error);