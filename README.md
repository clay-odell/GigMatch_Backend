# Capstone Project: Development Environment Setup Guide
Welcome to the setup guide for running the Capstone Project locally! This guide will walk you through setting up the development environment, installing dependencies, and configuring the necessary components to get the project up and running.

# API Information
Deployed Application: [GigMatch Calendar App](https://gigmatch-frontend-calendar-app.onrender.com)

You can register for both an Artist and Admin account to see the functionality and features available for each.

The API makes use of a Supabase Database, which relies on PostgreSQL, which can be done locally on your computer simply with PostgreSQL.

## Clone the Repository:
The repository can be cloned here:
[Entire Application](https://github.com/hatchways-community/capstone-project-two-243c35e4b3d0495d8aff390f9f8713bd).
[Frontend Only](https://github.com/clay-odell/GigMatch_Frontend_Calendar_App).
[Backend Only](https://github.com/clay-odell/GigMatch_Backend)

From GitBash or your preferred CLI: 
git clone https://https://github.com/hatchways-community/capstone-project-two-243c35e4b3d0495d8aff390f9f8713bd

After you've cloned the repository, install Node.js & NPM. You can download them from [Node.js](https://nodejs.org/). After that we can install dependencies for both the front- and backend.

From inside the initial project folder:
npm install

After those dependencies are installed, create a .env file in the backend directory and add the follwing environment variables:
DATABASE_URL=your_database_url
SECRET_KEY=your-secret-key

You will need to install [PostgreSQL](https://www.postgresql.org/download/).

After that, you will need to create your database from your CLI:
createdb gigmatch_db (or whatever you should choose).

Navigate to the frontend by cd ../frontend
Install dependencies: npm install

Start the backend server:
npm start

Start the frontend server:
npm start

Both servers should now be running, and you can access the application at http://localhost:5173 (frontend)
and http://localhost:3000 (backend)

Additional Information:
Seeding your DB from your backend:
From Bash:
psql -U [your_username] -d [your_db_name] -f gigMatch-schema.sql


# Testing:
There are some existing test; however some of them currently don't perform as expected. An interesting personal challenge would be to fix the errors, and get the tests up and running as expected.


Happy coding!!! 