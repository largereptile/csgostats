import datetime
import json
import sys
import tabulate
import argparse
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
from matplotlib.font_manager import FontProperties

parser = argparse.ArgumentParser(description='See some stats')
parser.add_argument('-u', "--user", type=str, help="name of the user")
parser.add_argument('-i', "--input", type=str, help="input json file")

args = parser.parse_args()
ME = args.user
in_file = args.input

# RIVAL = "Stalin"

with open(in_file, "r", encoding="utf8") as f:
    data = json.load(f)

# Uncomment for facts
total_matches = len(data)
total_wins = len(list(filter(lambda x: x["myTeam"]["won"], data)))
total_draws = len(list(filter(lambda x: x["myTeam"]["draw"], data)))
total_top_frags = len(list(filter(lambda x: max(list(map(lambda y: y["kills"], x["myTeam"]["players"]))) == list(filter(lambda y: y["name"] == ME, x["myTeam"]["players"]))[0]["kills"], data)))
total_top_scores = len(list(filter(lambda x: x["myTeam"]["players"][0]["name"] == ME, data)))
total_mvps = sum(list(map(lambda x: list(filter(lambda y: y["name"] == ME, x["myTeam"]["players"]))[0]["mvps"], data)))
average_leaderboard_pos = sum(list(map(lambda x: list(map(lambda y: y["name"], x["myTeam"]["players"])).index(ME), data)))/total_matches

total_kills = sum(list(map(lambda x: list(filter(lambda y: y["name"] == ME, x["myTeam"]["players"]))[0]["kills"], data)))
total_assists = sum(list(map(lambda x: list(filter(lambda y: y["name"] == ME, x["myTeam"]["players"]))[0]["assists"], data)))
total_deaths = sum(list(map(lambda x: list(filter(lambda y: y["name"] == ME, x["myTeam"]["players"]))[0]["deaths"], data)))

print(f"Total Matches: {total_matches}")
print(f"Total Wins: {total_wins}")
print(f"Total Draws: {total_draws}")
print(f"Win Rate: {(total_wins/total_matches)*100}%")
print(f"No. Top Frags: {total_top_frags}")
print(f"No. Top Score: {total_top_scores}")
print(f"No. MVPs: {total_mvps}")
print(f"Avg. Leaderboard Position: {average_leaderboard_pos}")
print(f"K/A/D: {total_kills}/{total_assists}/{total_deaths}")
print(f"Kills + Assists/Death Ratio: {(total_kills+total_assists)/total_deaths}")

maps = {}
map_wins = {}
maps_over_time = {}

players = {}
player_wins = {}

# games_ahead_of_rival = 0
for match in data:
    timestamp = datetime.datetime.strptime(match["time"], "%a, %d %b %Y %H:%M:%S %Z")
    period = (timestamp.month, timestamp.year)

    map_name = match["map"]
    if map_name not in maps.keys():
        maps[map_name] = 0
    if map_name not in map_wins.keys():
        map_wins[map_name] = 0
    if map_name not in maps_over_time.keys():
        maps_over_time[map_name] = {}
    if period not in maps_over_time[map_name].keys():
        maps_over_time[map_name][period] = 0

    maps_over_time[map_name][period] += 1

    for player in match["myTeam"]["players"]:
        name = player["name"]
        # if name == RIVAL:
        #     new = list(map(lambda x: x["name"], match["myTeam"]["players"]))
        #     if new.index(RIVAL) > new.index(ME):
        #         games_ahead_of_rival += 1
        if name not in players.keys():
            players[name] = 0
        if name not in player_wins.keys():
            player_wins[name] = 0
        players[name] += 1
        player_wins[name] += 1 if match["myTeam"]["won"] else 0

    maps[map_name] += 1
    map_wins[map_name] += 1 if match["myTeam"]["won"] else 0

first_game = datetime.datetime.strptime(data[-1]["time"], "%a, %d %b %Y %H:%M:%S %Z")
last_game = datetime.datetime.strptime(data[0]["time"], "%a, %d %b %Y %H:%M:%S %Z")
delta = relativedelta(months=+1)

plt.figure(figsize=(1000/100, 500/100), dpi=100)
plt.xticks(rotation=45)
for map_name, periods in maps_over_time.items():
    current_game = first_game
    while current_game <= (last_game + delta):
        current_period = (current_game.month, current_game.year)
        if current_period not in periods.keys():
            periods[current_period] = 0
        current_game += delta

    period_times = [(datetime.datetime(year=k[1], month=k[0], day=1), v) for k, v in periods.items()]
    period_times.sort(key=lambda a: a[0])
    x_axis = list(map(lambda a: f"{a[0].month}, {a[0].year}", period_times))
    y_axis = list(map(lambda a: a[1], period_times))
    plt.plot(x_axis, y_axis, label=map_name)

fontP = FontProperties()
fontP.set_size('small')
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', prop=fontP)
ax = plt.gca()
ax.set_xlabel("Month")
ax.set_ylabel("Playcount")
ax.set_title("Monthly Map Playcount")
plt.show()

# print(f"Percentage of games where you were ahead of {RIVAL}: {(games_ahead_of_rival/players[RIVAL])*100}%")

# Uncomment for winrates per map
map_winrates = [(name, map_wins[name] / maps[name]) for name in maps.keys()]
map_winrates.sort(key=lambda k: k[1])
map_winrates = list(map(lambda k: (k[0], f"{k[1] * 100}%"), map_winrates))
print(tabulate.tabulate(reversed(map_winrates), headers=["Map Name", "Winrate"]))
#
# Uncomment for winrates with players
gamer_scores = [(name, (player_wins[name] / players[name])) for name in list(filter(lambda x: players[x] > 1, players.keys()))]
gamer_scores.sort(key=lambda x: x[1])
gamer_scores = list(map(lambda x: (x[0], f"{x[1] * 100}%"), gamer_scores))
print(tabulate.tabulate(reversed(gamer_scores), headers=["Player Name", "Win %"]))

