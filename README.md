# csgostats

Script for Grease/Tampermonkey to scrape your match data from the [steam personal game data page](https://steamcommunity.com/my/gcpd/730/?tab=matchhistorycompetitive) because they don't want to just give me a download button.

Scrolls down the page upon loading it, and then exports a .json file upon reaching the bottom containing all the data about the matches.

Click [here](https://raw.githubusercontent.com/largereptile/csgostats/main/csgo.user.js) to automatically install it.

JSON Format:

```json
[
   {
      "map":"de_vertigo",
      "time":"Sun, 09 May 2021 22:10:46 GMT",
      "waitTime":11,
      "duration":1296,
      "myTeam":{
         "score":16,
         "won":true,
         "draw":false,
         "players":[
            {
               "name":"Player 1",
               "ping":38,
               "kills":19,
               "assists":3,
               "deaths":6,
               "mvps":5,
               "hsp":42,
               "score":52
            },
            {
               "name":"Player 2",
               "ping":13,
               "kills":17,
               "assists":3,
               "deaths":5,
               "mvps":3,
               "hsp":35,
               "score":44
            },
            {
               "name":"Player 3",
               "ping":6,
               "kills":13,
               "assists":5,
               "deaths":10,
               "mvps":2,
               "hsp":23,
               "score":38
            },
            {
               "name":"Player 4",
               "ping":30,
               "kills":15,
               "assists":3,
               "deaths":12,
               "mvps":2,
               "hsp":60,
               "score":33
            },
            {
               "name":"Player 5",
               "ping":21,
               "kills":15,
               "assists":1,
               "deaths":9,
               "mvps":4,
               "hsp":56,
               "score":32
            }
         ]
      },
      "enemyTeam":{
         "score":1,
         "won":false,
         "draw":false,
         "players":[
            {
               "name":"Player 6",
               "ping":46,
               "kills":12,
               "assists":2,
               "deaths":16,
               "mvps":1,
               "hsp":61,
               "score":31
            },
            {
               "name":"Player 7",
               "ping":31,
               "kills":10,
               "assists":4,
               "deaths":16,
               "mvps":0,
               "hsp":30,
               "score":25
            },
            {
               "name":"Player 8",
               "ping":30,
               "kills":9,
               "assists":3,
               "deaths":17,
               "mvps":0,
               "hsp":11,
               "score":23
            },
            {
               "name":"Player 9",
               "ping":37,
               "kills":6,
               "assists":2,
               "deaths":16,
               "mvps":0,
               "hsp":28,
               "score":16
            },
            {
               "name":"Player 10",
               "ping":42,
               "kills":2,
               "assists":4,
               "deaths":17,
               "mvps":0,
               "hsp":null,
               "score":8
            }
         ]
      }
   }
]
```