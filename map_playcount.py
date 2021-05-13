import datetime
import json
import argparse
import matplotlib.pyplot as plt
from dateutil.relativedelta import relativedelta
from matplotlib.font_manager import FontProperties
from utils import make_over_time_graph

parser = argparse.ArgumentParser(description='See some stats')
parser.add_argument('-i', "--input", type=str, help="input json file")
parser.add_argument('-t', "--timeframe", type=str, help="time frame to group play_count by", choices=["d", "w", "m", "y"])

args = parser.parse_args()
in_file = args.input if args.input else "out.json"
timeframe = args.timeframe if args.timeframe else "m"


with open(in_file, "r", encoding="utf8") as f:
    data = json.load(f)

maps_over_time = {}

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

    map_name = match["map"]

    if map_name not in maps_over_time.keys():
        maps_over_time[map_name] = {}
    if period not in maps_over_time[map_name].keys():
        maps_over_time[map_name][period] = 0

    maps_over_time[map_name][period] += 1

make_over_time_graph(data, timeframe, maps_over_time, "Map Playcount", 0)
