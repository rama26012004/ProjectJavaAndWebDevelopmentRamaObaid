# MoodMelody mood-based playlist generator 

## About the project 

This project is a web application that creates personalized playlists based on the user's mood, genre preferences, and other factors such as weather and physical activity data. It integrates with Spotify and YouTube to fetch and play music and with Fitbit and Weather APIs to tailor the playlist experience.

## Features

- Generate playlists based on mood, genre, and artist preferences.
- Integrate with Spotify and YouTube to fetch music and playlists.
- Integrate with YouTube for music playback
- Fetch weather data to tailor playlists based on current weather conditions.
- Use physical activity data from Fitbit to create workout-specific playlists.
- User-friendly interface for easy navigation and interaction.

# .env file 
The '.env' file is essential for running the server side of the code. To assist you, I have created a '.env.example' file in the server folder that contains the necessary variables. Please note that I have provided the values for these variables, such as API keys and client secrets, in the first slide of the Phase 2 submission. Therefore, you should create a '.env' file in the server directory and copy these values into it.


## Installing 

### Prerequisites
Node.js (v20.18.0) is used in this project
npm or yarn (This project steps work with npm) 

### Install dependencies 
To make this code work without any error, you need to install the following dependencies :
- npm install express mongoose axios qs cors dotenv
- npm install react react-dom
- npm install react-scripts
- npm install react-icons
- npm install react-router-dom


## Starting the application 
You need to go to the directories where the server.js is located, then enter this command to make the server side work: 

node server.js 

if you download the code as a zip file, extract the files and 
ideally, the commands will be like: 
cd desktop 
cd ProjectJavaAndWebDevelopment-main
cd server
node server.js


For the UI frontend part, you need to go to the directories where the codes exist and then start it by writing : 

npm start 
ideally the command will be like(if the files are downloaded into your local machine) : 
cd desktop 
cd ProjectJavaAndWebDevelopment-main
cd client 
npm start 

## Limitations : 
Please note that if you need to log in to Spotify, I need to add your username and email as a tester in my developer dashboard; otherwise, authorization is not possible.
To make Spotify playlists and tracks work on my website directly the user using my website needs to have a premium account, therefore I eliminated this feature and only allowed users to redirect to the Spotify platform


## Technology Stack:

### Frontend:
React.js: For building the user interface.
HTML/CSS: For styling and structuring the web pages.

### Backend:
Node.js: For server-side scripting.
Express: For handling HTTP requests and routing.
MongoDB: For data storage.

### APIs:
Spotify API: For fetching music.
Weather API: For fetching weather data.
Fitness Tracker API: For fetching physical activity data.
YouTube API: For fetching and playing music.

## Connections 
For any questions or suggestions, feel free to reach out to me at rama.obaid.26@gmail.com 
