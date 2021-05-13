import json
import argparse
import datetime

parser = argparse.ArgumentParser(description='See some stats')
parser.add_argument('-u', "--user", type=str, help="name of the user")
parser.add_argument('-i', "--input", type=str, help="input json file")
parser.add_argument('-r', "--rival", type=str, help="optional name of user to compare to", default=None)

args = parser.parse_args()
ME = args.user
in_file = args.input
RIVAL = args.rival if args.rival else None


with open(in_file, "r", encoding="utf8") as f:
    data = json.load(f)


def contains_rival(match):
    return RIVAL in list(map(lambda x: x["name"], match["myTeam"]["players"]))


def total_wins(matches):
    return len(list(filter(lambda x: x["myTeam"]["won"], matches)))


def total_draws(matches):
    return len(list(filter(lambda x: x["myTeam"]["draw"], matches)))


def top_frags(matches, name):
    return len(list(filter(lambda x: max(list(map(lambda y: y["kills"], x["myTeam"]["players"]))) ==
                              list(filter(lambda y: y["name"] == name, x["myTeam"]["players"]))[0][
                                  "kills"], matches)))


def top_scores(matches, name):
    return len(list(filter(lambda x: x["myTeam"]["players"][0]["name"] == name, matches)))


def total_mvps(matches, name):
    return sum(
        list(map(lambda x: list(filter(lambda y: y["name"] == name, x["myTeam"]["players"]))[0]["mvps"], matches)))


def average_leaderboard_pos(matches, name):
    return sum(list(map(lambda x: list(map(lambda y: y["name"], x["myTeam"]["players"])).index(name), matches))) / len(matches)


def total_kills(matches, name):
    return sum(
        list(map(lambda x: list(filter(lambda y: y["name"] == name, x["myTeam"]["players"]))[0]["kills"], matches)))


def total_assists(matches, name):
    return sum(
        list(map(lambda x: list(filter(lambda y: y["name"] == name, x["myTeam"]["players"]))[0]["assists"], matches)))


def total_deaths(matches, name):
    return sum(
        list(map(lambda x: list(filter(lambda y: y["name"] == name, x["myTeam"]["players"]))[0]["deaths"], matches)))


def playing_time(matches):
    return sum(list(map(lambda x: x["duration"], matches)))


def waiting_time(matches):
    return sum(list(map(lambda x: x["waitTime"], matches)))


if RIVAL:
    data = list(filter(lambda k: contains_rival(k), data))

total_matches = len(data)
wins = total_wins(data)
draws = total_draws(data)
total_top_frags = top_frags(data, ME)
total_top_scores = top_scores(data, ME)
mvps = total_mvps(data, ME)
average_leaderboard_position = average_leaderboard_pos(data, ME)

kills = total_kills(data, ME)
assists = total_assists(data, ME)
deaths = total_deaths(data, ME)

total_playing_time = playing_time(data)
total_waiting_time = waiting_time(data)

if not RIVAL:
    output_string = f"""
Stats for {ME}
-----------------------------------------

Totals:
--------
Total Matches: {total_matches}
Total Wins: {wins}
Total Draws: {draws}
No. Top Frags: {total_top_frags}
No. Top Score: {total_top_scores}
No. MVPs: {mvps}
Total K/A/D: {kills}/{assists}/{deaths}
Total In-game Time: {datetime.timedelta(seconds=total_playing_time)}
Total Queueing Time: {datetime.timedelta(seconds=total_waiting_time)}

Averages:
--------
Kills per Game: {round(kills / total_matches, 2)}
Assists per Game: {round(assists / total_matches, 2)}
Deaths per Game: {round(deaths / total_matches, 2)}
K/D Ratio: {round(kills / deaths, 2)}
Kills + Assists/Death Ratio: {round((kills + assists) / deaths, 2)}
Avg. Leaderboard Position: {round(average_leaderboard_position, 2)}
    """
    print(output_string)
else:
    r_total_top_frags = top_frags(data, RIVAL)
    r_total_top_scores = top_scores(data, RIVAL)
    r_total_mvps = total_mvps(data, RIVAL)
    r_average_leaderboard_position = average_leaderboard_pos(data, RIVAL)

    r_total_kills = total_kills(data, RIVAL)
    r_total_assists = total_assists(data, RIVAL)
    r_total_deaths = total_deaths(data, RIVAL)

    avg_kill_difference = round((kills/total_matches) - (r_total_kills/total_matches), 2)
    akd_string = f"{ME} gets {avg_kill_difference} more kills than {RIVAL} per game" if avg_kill_difference > 0 else f"{RIVAL} gets {-avg_kill_difference} more kills than {ME} per game"

    avg_assist_difference = round((assists/total_matches) - (r_total_assists/total_matches), 2)
    aad_string = f"{ME} gets {avg_assist_difference} more assists than {RIVAL} per game" if avg_assist_difference > 0 else f"{RIVAL} gets {-avg_assist_difference} more assists than {ME} per game"

    avg_death_difference = round((deaths/total_matches) - (r_total_deaths/total_matches), 2)
    add_string = f"{ME} gets {avg_death_difference} more deaths than {RIVAL} per game" if avg_death_difference > 0 else f"{RIVAL} gets {-avg_death_difference} more deaths than {ME} per game"

    avg_mvp_difference = round((mvps/total_matches) - (r_total_mvps/total_matches), 2)
    amd_string = f"{ME} gets {avg_mvp_difference} more MVPs than {RIVAL} per game" if avg_mvp_difference > 0 else f"{RIVAL} gets {-avg_mvp_difference} more MVPs than {ME} per game"

    avg_leaderboard_difference = round(average_leaderboard_position - r_average_leaderboard_position, 2)
    all_string = f"{ME} is {-avg_leaderboard_difference} places higher than {RIVAL} per game" if avg_leaderboard_difference < 0 else f"{RIVAL} is {avg_leaderboard_difference} places higher than {ME} per game"

    output_string = f"""
Stats for {ME} with {RIVAL}
-----------------------------------------

Totals:
--------
Total Matches Together: {total_matches}
Total Wins: {wins}
Total Draws: {draws}

No. Top Frags: {total_top_frags} vs {r_total_top_frags}
No. Top Score: {total_top_scores} vs {r_total_top_scores}
No. MVPs: {mvps} vs {r_total_mvps}
Total K/A/D: {kills}/{assists}/{deaths} vs {r_total_kills}/{r_total_assists}/{r_total_deaths}

Total In-game Time: {datetime.timedelta(seconds=total_playing_time)}
Total Queueing Time: {datetime.timedelta(seconds=total_waiting_time)}

Averages:
--------
Average Kill Difference: {akd_string}
Average Assist Difference: {aad_string}
Average Death Difference: {add_string}
Average MVP Difference: {amd_string}
Average Leaderboard Difference: {all_string}"""
    print(output_string)