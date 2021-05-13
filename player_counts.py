import datetime
import json
import sys
import tabulate
import argparse
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
from matplotlib.font_manager import FontProperties

from utils import make_over_time_graph, make_pie_chart, make_bar_chart

parser = argparse.ArgumentParser(description='See some stats')
parser.add_argument('-u', "--user", type=str, help="name of the user")
parser.add_argument('-i', "--input", type=str, help="input json file")
parser.add_argument('-p', "--playcount", type=int, help="lower limit for games you have played with them", default=2)
parser.add_argument('-t', "--timeframe", type=str, help="time frame to group play_count by", choices=["d", "w", "m", "y"])
parser.add_argument('-l', "--limit", type=int, help="pie chart limit")

args = parser.parse_args()
ME = args.user
in_file = args.input
play_cap = args.playcount
timeframe = args.timeframe if args.timeframe else "m"
limit = args.limit if args.limit else 11

with open(in_file, "r", encoding="utf8") as f:
    data = json.load(f)

total_wins = len(list(filter(lambda x: x["myTeam"]["won"], data)))

players = {}
player_wins = {}
playcount_time = {}
win_percent_time = {}
control_win_percent = {}

for match in data:
    timestamp = datetime.datetime.strptime(match["time"], "%a, %d %b %Y %H:%M:%S %Z")
    if timeframe == "m":
        period = (timestamp.month, timestamp.year)
    elif timeframe == "w":
        period = (timestamp.isocalendar()[1], timestamp.year)
    elif timeframe == "y":
        period = timestamp.year
    else:
        period = (timestamp.day, timestamp.month, timestamp.year)

    if period not in control_win_percent:
        control_win_percent[period] = 0

    control_win_percent[period] += 1 if match["myTeam"]["won"] else 0

    for player in match["myTeam"]["players"]:
        name = player["name"]
        if name == ME:
            continue
        if name not in win_percent_time.keys():
            win_percent_time[name] = {}
        if name not in playcount_time.keys():
            playcount_time[name] = {}
        if period not in win_percent_time[name].keys():
            win_percent_time[name][period] = 0
        if period not in playcount_time[name].keys():
            playcount_time[name][period] = 0
        if name not in players.keys():
            players[name] = 0
        if name not in player_wins.keys():
            player_wins[name] = 0
        players[name] += 1
        player_wins[name] += 1 if match["myTeam"]["won"] else 0
        playcount_time[name][period] += 1
        win_percent_time[name][period] += 1 if match["myTeam"]["won"] else 0

first_game = datetime.datetime.strptime(data[-1]["time"], "%a, %d %b %Y %H:%M:%S %Z")
last_game = datetime.datetime.strptime(data[0]["time"], "%a, %d %b %Y %H:%M:%S %Z")

if timeframe == "m":
    delta = relativedelta(months=+1)
elif timeframe == "w":
    delta = relativedelta(weeks=+1)
elif timeframe == "y":
    delta = relativedelta(years=+1)
else:
    delta = relativedelta(days=+1)

playcount_time = {k: v for k, v in playcount_time.items() if players[k] >= play_cap}
win_percent_time = {k: ({period: round((count / control_win_percent[period]) * 100, 2) for period, count in v.items() if control_win_percent[period] != 0}) for k, v in win_percent_time.items() if players[k] >= play_cap}


# make_over_time_graph(data, timeframe, playcount_time, "Playcount", 0)
# make_over_time_graph(data, timeframe, win_percent_time, "Win Percentage", 1)


#
# gamer_scores = [("Win %", [(name, (player_wins[name] / players[name])) for name in list(filter(lambda x: players[x] >= play_cap, players.keys()))]), ("% of total wins contributed to", [(name, (player_wins[name] / total_wins)) for name in list(filter(lambda x: players[x] >= play_cap, players.keys()))])]
#
# for tag, scores in gamer_scores:
#     scores.sort(key=lambda x: x[1])
#     scores = list(map(lambda x: (x[0], f"{x[1] * 100}%"), scores))
#     print(tabulate.tabulate(reversed(scores), headers=["Player Name", tag]))

# games_played_with = [(name, count) for name, count in players.items()]
# games_played_with.sort(key=lambda k: k[1], reverse=True)

# make_pie_chart(games_played_with, "Playcount with Players", 2, limit)


# games_with_percent = [(name, round((count/len(data)) * 100), 2) for name, count in players.items()]
# games_with_percent.sort(key=lambda k: k[1], reverse=True)
# make_bar_chart(games_with_percent, "Players", "Percentage", "Percentage of Games including Player", 3, limit)

# wins_with = [(name, count) for name, count in player_wins.items()]
# wins_with.sort(key=lambda k: k[1], reverse=True)
# make_pie_chart(wins_with, "Wins with Players", 3, limit)


# win_percentages = [(name, round((player_wins[name] / players[name]) * 100, 2)) for name in list(filter(lambda x: players[x] >= play_cap, players.keys()))]
# win_percentages.sort(key=lambda k: k[1], reverse=True)
# make_bar_chart(win_percentages, "Players", "Percentage", "Win Percentage With Player", 4, limit)


# win_contribution = [(name, round((player_wins[name] / total_wins) * 100, 2)) for name in list(filter(lambda x: players[x] >= play_cap, players.keys()))]
# win_contribution.sort(key=lambda k: k[1], reverse=True)
# make_bar_chart(win_contribution, "Players", "Percentage", "Percentage of total wins player contributed to", 5, limit)

