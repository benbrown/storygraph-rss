# Storygraph RSS Feed Generator

This script generates an RSS feed from your Storygraph reading history. It fetches your read books from Storygraph and creates an RSS feed that can be used with any RSS reader.

## Prerequisites

- Node.js 
- npm (Node Package Manager)
- A Storygraph account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/benbrown/storygraph-rss.git
cd storygraph-rss
```

2. Install dependencies:
```bash
npm install
```

## Configuration

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your settings:
```env
# Your Storygraph username
STORYGRAPH_USER=your_username

# The output file for the RSS feed
OUTPUT_FILE=feed.xml

# Your Storygraph session cookie (see instructions below)
SESSION_COOKIE=_storygraph_session=your_session_cookie_here

# Feed metadata
FEED_TITLE="My Reading History"
FEED_DESCRIPTION="Books I've read on Storygraph"
FEED_URL="https://yourdomain.com/feed.xml"
FEED_SITE_URL="https://yourdomain.com"
```

### Getting Your Session Cookie

1. Log in to [Storygraph](https://app.thestorygraph.com)
2. Open your browser's developer tools (F12 or right-click -> Inspect)
3. Go to the Application/Storage tab
4. Look for Cookies under Storage
5. Find the `_storygraph_session` cookie
6. Copy its value and paste it into your `.env` file

## Usage

Run the script to generate your RSS feed:
```bash
node updateFeed.js
```

The script will:
1. Fetch your reading history from Storygraph
2. Generate an RSS feed with your read books
3. Save the feed to the specified output file

## RSS Feed Contents

Each feed item includes:
- Book title and author
- Date finished reading
- Book cover image
- Link to the book on Storygraph

## License

MIT License - feel free to use this code for your own projects! 