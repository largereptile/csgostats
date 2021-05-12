// ==UserScript==
// @name     csgostats to json
// @namespace https://steamcommunity.com
// @include https://steamcommunity.com/id/*/gcpd/730?tab=matchhistorycompetitive
// @version  1
// @grant    none
// ==/UserScript==

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getHistory(lastGame, biglastgame) {
  var btn = document.getElementsByClassName("load_more_history_area");
  var g = [...document.querySelector('.generic_kv_table.csgo_scoreboard_root').children[0].children];
  var newGame = g[g.length - 1].querySelector(".csgo_scoreboard_inner_left").querySelectorAll("tr>td")[1].innerHTML;
  var btn2 = document.getElementById("load_more_button");
  if(btn.length != 0 && (lastGame != newGame && biglastgame.length != g.length) && (btn2.style.display != "none")) {
    var len = g.length;
    btn[0].firstElementChild.click();
    var popup = document.getElementsByClassName("newmodal");
    if(popup.length != 0) {
      popup[0].remove();
      document.getElementsByClassName("newmodal_background").remove();
    }
    var gLen = [...document.querySelector('.generic_kv_table.csgo_scoreboard_root').children[0].children].length;
    var d = new Date();
		var n = d.getTime();
    var timeout = 10000;
		while(gLen == len && (new Date().getTime() < (n + timeout))) {
     await sleep(100);
     gLen = [...document.querySelector('.generic_kv_table.csgo_scoreboard_root').children[0].children].length;
     btn2 = document.getElementById("load_more_button");
    }
    window.scrollTo(0,document.body.scrollHeight);
    getHistory(newGame, g);
  } else {
    addAllMatches();
  }
}


const matches = [];
const MAPS = {
    'Competitive Office':'cs_office',
    'Competitive Agency':'cs_agency',
    'Competitive Insertion':'cs_insertion',
    'Competitive Vertigo':'de_vertigo',
    'Competitive Dust II':'de_dust2',
    'Competitive Mirage':'de_mirage',
    'Competitive Inferno':'de_inferno',
    'Competitive Nuke':'de_nuke',
    'Competitive Austria':'de_austria',
    'Competitive de_anubis':'de_anubis',
    'Competitive Cobblestone':'de_cbble',
    'Competitive Biome':'de_biome',
    'Competitive Cache':'de_cache',
    'Competitive Ruby':'de_ruby',
    'Competitive Workout':'cs_workout',
    'Competitive Zoo':'de_zoo',
    'Competitive Train':'de_train',
    'Competitive Overpass':'de_overpass',
    'Competitive Canals':'de_canals',
    'Competitive Abbey':'de_abbey',
    'Competitive Italy':'cs_italy',
    'Competitive Assault':'cs_assault',
	'Competitive Subzero':'de_subzero',
	'Competitive Breach':'de_breach',
}

function addMatch(game) {
  const match = {};
  matches.push(match);
  const leftSide = game.querySelector('.csgo_scoreboard_inner_left');
    const info= leftSide.querySelectorAll('tr>td');
    match.map = MAPS[info[0].innerHTML.replace(/\n|\t|\r/g,'')] || info[0].innerHTML.replace(/\n|\t|\r|(Competitive )/g,'');
    var tempTime = info[1].innerHTML.replace(/\n|\t|\r/g,'');
    tempTime = tempTime.replace(/-/g, ' ')
    match.time = new Date(tempTime).toUTCString();
    match.waitTime = hmsToSecondsOnly(info[2].innerHTML.replace(/\n|\t|\r|(Wait Time: )/g,''));
    match.duration = hmsToSecondsOnly(info[3].innerHTML.replace(/\n|\t|\r|(Match Duration: )/g,''));
    const rightSide = game.querySelector('.csgo_scoreboard_inner_right>tbody');
    const rse = [...rightSide.children];
    rse.shift();
    const topTeamRaw = rse.slice(0,5);
    const bottomTeamRaw = rse.slice(6,11);
    const scoreStr = rse[5].querySelector('td').innerHTML;
    const topTeamPlayers = topTeamRaw.map(t => {
        const c = t.children;
        const name = c[0].querySelector('a.linkTitle').innerHTML;
        const mps= c[5].innerHTML;
        let mvps=0;
        if(mps.startsWith('★')){
            if(!mps.replace('★','')){
                mvps = 1
            }else{
                mvps = parseInt(mps.replace('★',''))
            }
        }
        return {
            name:name,
            ping:parseInt(c[1].innerHTML),
            kills:parseInt(c[2].innerHTML),
            assists:parseInt(c[3].innerHTML),
            deaths:parseInt(c[4].innerHTML),
            mvps:mvps,
            hsp:parseInt(c[6].innerHTML.replace('%','')),
            score:parseInt(c[7].innerHTML)
        }
    });
    const bottomTeamPlayers = bottomTeamRaw.map(t => {
        const c = t.children;
        const name = c[0].querySelector('a.linkTitle').innerHTML;
        const mps= c[5].innerHTML;
        let mvps=0;
        if(mps.startsWith('★')){
            if(!mps.replace('★','')){
                mvps = 1
            }else{
                mvps = parseInt(mps.replace('★',''))
            }
        }
        return {
            name:name,
            ping:parseInt(c[1].innerHTML),
            kills:parseInt(c[2].innerHTML),
            assists:parseInt(c[3].innerHTML),
            deaths:parseInt(c[4].innerHTML),
            mvps:mvps,
            hsp:parseInt(c[6].innerHTML.replace('%','')),
            score:parseInt(c[7].innerHTML)
        }
    });
    const ssts=scoreStr.split(':');
    const topTeam = {
        score:parseInt(ssts[0]),
        won:parseInt(ssts[0]) > parseInt(ssts[1]),
        draw:parseInt(ssts[1]) == parseInt(ssts[0]),
        players:topTeamPlayers
    };
    const bottomTeam = {
        score:parseInt(ssts[1]),
        won:parseInt(ssts[1]) > parseInt(ssts[0]),
        draw:parseInt(ssts[1]) == parseInt(ssts[0]),
        players:bottomTeamPlayers
    };
    const myTeam = topTeam.players.map(r=>r.name).includes('wndy') ? topTeam : bottomTeam;
    const enemyTeam = myTeam == topTeam ? bottomTeam : topTeam;
    match.myTeam = myTeam;
    match.enemyTeam = enemyTeam;
}

function addAllMatches() {
  var games = [...document.querySelector('.generic_kv_table.csgo_scoreboard_root').children[0].children];
  games.shift();
  games.forEach(addMatch);
  var matches2 = [];
  for(var i = 0; i<matches.length; i++) {
    if(!matches2.includes(matches[i])) {
        matches2.push(matches[i]);
    }    
  }
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(matches2));
  var dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "out.json");
  document.body.appendChild(dlAnchorElem); // required for firefox
  dlAnchorElem.click();
  dlAnchorElem.remove();
  console.log("should be done");
  
}

getHistory("", []);

