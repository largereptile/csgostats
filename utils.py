import random

import matplotlib.pyplot as plt
import matplotlib.cm as cm
from matplotlib.colors import Normalize
import datetime

from dateutil.relativedelta import relativedelta
from matplotlib.font_manager import FontProperties


def make_over_time_graph(data, timeframe, fields, label, fig_number):
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

    plt.figure(fig_number, figsize=(1600 / 100, 700 / 100), dpi=100)
    plt.xticks(rotation=45)
    ax = plt.gca()
    for subject, periods in fields.items():
        current_game = first_game
        while current_game <= (last_game + delta):
            if timeframe == "m":
                current_period = (current_game.month, current_game.year)
            elif timeframe == "w":
                current_period = (current_game.isocalendar()[1], current_game.year)
            elif timeframe == "y":
                current_period = current_game.year
            else:
                current_period = (current_game.day, current_game.month, current_game.year)

            if current_period not in periods.keys():
                periods[current_period] = 0
            current_game += delta
        if timeframe == "m":
            period_times = [(datetime.datetime(year=k[1], month=k[0], day=1), v) for k, v in periods.items()]
            period_times.sort(key=lambda a: a[0])
            x_axis = list(map(lambda a: f"{a[0].month}, {a[0].year}", period_times))
            y_axis = list(map(lambda a: a[1], period_times))
            ax.set_xlabel("Month")
            ax.set_title(f"Monthly {label}")
        elif timeframe == "w":
            period_times = [(datetime.datetime(year=k[1], month=1, day=1) + relativedelta(weeks=+k[0]), v) for k, v in
                            periods.items()]
            period_times.sort(key=lambda a: a[0])
            x_axis = list(map(lambda a: f"{a[0].isocalendar()[1]}, {a[0].year}", period_times))
            y_axis = list(map(lambda a: a[1], period_times))
            ax.set_xlabel("Week")
            ax.set_title(f"Weekly {label}")
        elif timeframe == "y":
            period_times = [(datetime.datetime(year=k, month=1, day=1), v) for k, v in periods.items()]
            period_times.sort(key=lambda a: a[0])
            x_axis = list(map(lambda a: f"{a[0].year}", period_times))
            y_axis = list(map(lambda a: a[1], period_times))
            ax.set_xlabel("Year")
            ax.set_title(f"Yearly {label}")
        else:
            period_times = [(datetime.datetime(year=k[2], month=k[1], day=k[0]), v) for k, v in periods.items()]
            period_times.sort(key=lambda a: a[0])
            x_axis = list(map(lambda a: f"{a[0].day}/{a[0].month}/{a[0].year}", period_times))
            y_axis = list(map(lambda a: a[1], period_times))
            ax.set_xlabel("Day")
            ax.set_title(f"Daily {label}")
        plt.plot(x_axis, y_axis, label=subject, color=(random.random(), random.random(), random.random()))

    fontP = FontProperties()
    fontP.set_size('small')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', prop=fontP)
    plt.subplots_adjust(right=0.88)
    ax.set_ylabel(label)
    plt.show()


def make_pie_chart(data, label, fig_number, cap):
    colours = [(random.random(), random.random(), random.random()) for _ in range(len(data[:cap]))]
    plt.figure(fig_number, figsize=(1600 / 100, 700 / 100), dpi=100)
    ax = plt.gca()
    ax.set_title(label)
    plt.pie(list(map(lambda k: k[1], data[:cap])),
            labels=list(map(lambda k: f"{k[0]}: {k[1]}", data[:cap])), colors=colours)
    fontP = FontProperties()
    fontP.set_size('small')
    plt.legend(bbox_to_anchor=(1.3, 1), loc='upper left', prop=fontP)
    # plt.subplots_adjust(right=0.88)
    plt.show()


def make_bar_chart(data, x_label, y_label, title, fig_number, cap):

    plt.figure(fig_number, figsize=(1600 / 100, 700 / 100), dpi=100)
    plt.xticks(rotation=-45)
    ax = plt.gca()
    ax.set_title(title)
    x_axis = list(map(lambda k: k[0], data[:cap]))
    y_axis = list(map(lambda k: k[1], data[:cap]))
    colours = [(random.random(), random.random(), random.random()) for _ in range(len(data))]
    for x, y, c in zip(x_axis, y_axis, colours):
        plt.bar(x, y, color=c, label=f"{x}: {y}")
    plt.legend()
    ax.set_xlabel(x_label)
    ax.set_ylabel(y_label)
    plt.show()
