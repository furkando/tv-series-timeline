# TV Series Timeline

Explore character appearances in TV series over time with interactive visualizations, including a timeline with bubbles and a word cloud.

## Introduction

TV Series Timeline is a web application that allows users to explore character appearances in TV series over time. The application provides interactive visualizations, including a timeline with bubbles representing character appearances and a word cloud showing the frequency of character appearances within selected date ranges.

## Features

- **Search and Select TV Series**: Input TV series names and select from a list of results.
- **Interactive Timeline**: Visualize character appearances over time with a bubble timeline.
- **Dynamic Word Cloud**: Display character appearances as a word cloud, dynamically adjusted based on the selected date range.
- **Responsive Design**: Ensures usability across different devices and screen sizes.

## Tech Stack

- **Frontend**: React, Next.js, D3.js
- **Backend**: Supabase (for scraping TV series data)
- **Styling**: Tailwind CSS

## Installation

Follow these steps to set up the project locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/furkando/tv-series-timeline.git
   cd tv-series-timeline
   ```

2. **Install dependencies**:

   ```bash
   yarn
   ```

3. **Set up Supabase**:

   - Create a new project on [Supabase](https://supabase.io/).
   - Obtain the Supabase URL and API key from your project settings.
   - Create a `.env.local` file in the root directory and add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     TMDB_API_KEY=your-tmdb-api-key
     ```

4. **Run the development server**:

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Search for TV Series**: Use the search bar to find TV series and select from the results.
2. **Explore Timeline**: Visualize character appearances over time with the interactive timeline.
3. **Adjust Date Range**: Use the slider to adjust the date range and see how character appearances change.
4. **View Word Cloud**: The word cloud dynamically updates to show the frequency of character appearances within the selected date range.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
