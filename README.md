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

## Structure of this repository 
The most important folders in this repository are the server and client folders,
First, the server folder contains the server.js file that is responsible for running the server side of the code. In addition to the server.js it contains the '.env' file, these two files are the most crucial part of it.
Second, the client folder, which itself has multiple parts,
first is the src folder, this folder consists of several codes regarding the overall structure of the website such as App.js, App.css, and index files, it also consists of two folders: services folder which contains js code files regarding certain services used, and the other folder is the components folder, this folder contains most of the components I used to build my frontend and its style. 
In addition to the src folder the client folder contains the public folder which mainly consists of some images used in the website or some images to get fetched in case there is no playlist image "Null value " along with the index.html file and more. 

## .env file 
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
**You need to go to the directories where the server.js is located, then enter this command to make the server side work:** 

node server.js 

if you download the code as a zip file, extract the files and 
ideally, the commands will be like: 
1-cd desktop 
2-cd ProjectJavaAndWebDevelopmentRamaObaid
3-cd server
--create the .env file here 
4-node server.js


**For the UI frontend part, you need to go to the directories where the codes exist and then start it by writing :**

npm start 
ideally the command will be like(if the files are downloaded into your local machine) : 
1-cd desktop 
2-cd ProjectJavaAndWebDevelopmentRamaObaid
3-cd client 
4-npm start 

**In case you want to clone it from git follow this:**

Steps to clone the repository directly from Git, please note that these steps assume that you have already installed Git into your system : 

First, clone the repository, as an example :
git clone https://github.com/rama26012004/ProjectJavaAndWebDevelopment.git

Second, navigate to the cloned repository, as an example : 

cd ProjectJavaAndWebDevelopmentRamaObaid

Third, create the .env file in the server folder, and copy the values I have in the title slide, it's ideal to create a text file and then convert it to a .env file 

Fourth, you need to install the dependencies, as mentioned above, if you haven't yet 

Fifth, navigate to the server folder and start the node server.js,  as an example: cd ProjectJavaAndWebDevelopmentRamaObaid

cd server 

node server.js

Sixth, navigate to the client folder and start the frontend:
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
