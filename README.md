![travis-ci build status](https://travis-ci.org/SCCapstone2/FantasyDJ.svg?branch=master)

# FantasyDJ
## README

FantasyDJ is a mobile game where the user chooses songs they believe will increase in popularity, based
on Spotify's algorithm for determining the popularity of a song. The winner is determined by accumulating
the daily change in popularity of the songs in a playlist.

* Repo: https://github.com/SCCapstone/FantasyDJ
* Website: https://sccapstone.github.io/FantasyDJ/

### How to use FantasyDJ

* **Requirements:** You will need a Spotify account, either premium or free. 

* **Starting out:** After signing in you will land on the league page, which will show you the leagues that you
  are currently in (which will be none at first). Use the button that says "Start New League" to go to the league
  creation page. Choose a league name and the Spotify username of your opponent. If your opponent has installed
  FantasyDJ, they will receive a push notification saying they have been added to your league. The object of the
  game, essentially, is to pick the three songs that you believe will get more popular over the next week.
  
* **Picking songs:** When it is your turn to choose a song, click the "New Song" button in the league page.
  You will be presented with a page containing a list of the day's most popular songs according to Spotify plays.
  You can choose one of these or use the search box to find the song you want. Then you wait for your opponent
  to choose a song, and this will go back and forth until both players have 3 songs. At this point, your league
  is active. 
  
* **Waiting:** Over the next few days you will be able to see how you are doing in comparison to your opponent,
  both in the league page, and in another page for analytics, which shows a graph of how your songs have been 
  increased or decreased in popularity.  

### How do I get set up? ###

* **Requires:** NodeJS, Cordova, Ionic 2
* **Cordova Plugins Required:** Whitelist, InAppBrowser
* **Uses Firebase**
* **Deployment instructions:** see [BUILDING.md](./BUILDING.md)

### Who do I talk to? ###
#### Designers:
*   **Julia Strout:** jstrout@email.sc.edu
*   **Lane Oliver-Paull:** oliverpa@email.sc.edu
*   **Tom Brower:** browert2@email.sc.edu

#### Client: 
*   **Steve Rubin:** KonstantinRubin@engineer.com

