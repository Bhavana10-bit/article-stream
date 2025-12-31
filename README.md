# AI-Powered Article Enhancer

An intelligent content enhancement system that scrapes blog articles, enriches them with AI-generated improvements using external references, and displays them in a real-time updating interface.

## Project Architecture

```mermaid
flowchart TB
    subgraph UI["Frontend (React + Vite)"]
        A[Index Page] --> B[Scrape Articles Button]
        A --> C[Article Cards Grid]
        A --> D[Enhance Article Button]
        A --> E[Article Viewer Dialog]
    end

    subgraph EF["Edge Functions (Deno)"]
        F[scrape-beyondchats]
        G[enhance-article]
        H[articles-crud]
    end

    subgraph External["External Services"]
        I[Firecrawl API]
        J[Lovable AI]
    end

    subgraph DB["Lovable Cloud Database"]
        K[(articles table)]
    end

    B -->|"POST /scrape-beyondchats"| F
    F -->|"1. Scrape blog page"| I
    I -->|"2. Return article links"| F
    F -->|"3. Scrape each article"| I
    I -->|"4. Return content"| F
    F -->|"5. Insert articles"| K

    D -->|"POST /enhance-article"| G
    G -->|"6. Fetch article"| K
    G -->|"7. Search references"| I
    I -->|"8. Return related articles"| G
    G -->|"9. Scrape references"| I
    I -->|"10. Return reference content"| G
    G -->|"11. Enhance with AI"| J
    J -->|"12. Return enhanced content"| G
    G -->|"13. Update article"| K

    K -->|"Real-time subscription"| C
    C -->|"Auto-refresh on changes"| A
```

## Data Flow

1. **Scrape Phase**: User clicks "Scrape Articles" → Edge function uses Firecrawl to scrape BeyondChats blogs → Articles stored in database with status "scraped"

2. **Enhance Phase**: User clicks "Enhance" on an article → Edge function fetches related content via Firecrawl → Lovable AI rewrites the article with references → Updated article stored with status "enhanced"

3. **Real-time Updates**: Database changes trigger real-time events → React Query cache updates automatically → UI reflects changes instantly

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
