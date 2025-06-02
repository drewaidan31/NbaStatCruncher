#!/usr/bin/env python3

import json
import sys

def get_sample_nba_players():
    """Get sample NBA players with realistic statistics"""
    players = [
        {
            'playerId': 2544,
            'name': 'LeBron James',
            'team': 'LAL',
            'position': 'F',
            'gamesPlayed': 71,
            'minutesPerGame': 35.3,
            'points': 25.7,
            'assists': 8.3,
            'rebounds': 7.3,
            'steals': 1.3,
            'blocks': 0.5,
            'turnovers': 3.5,
            'fieldGoalPercentage': 0.540,
            'threePointPercentage': 0.410,
            'freeThrowPercentage': 0.750,
            'plusMinus': 4.2
        },
        {
            'playerId': 201939,
            'name': 'Stephen Curry',
            'team': 'GSW',
            'position': 'G',
            'gamesPlayed': 74,
            'minutesPerGame': 32.7,
            'points': 26.4,
            'assists': 5.1,
            'rebounds': 4.5,
            'steals': 0.9,
            'blocks': 0.4,
            'turnovers': 3.1,
            'fieldGoalPercentage': 0.453,
            'threePointPercentage': 0.427,
            'freeThrowPercentage': 0.915,
            'plusMinus': 5.8
        },
        {
            'playerId': 201566,
            'name': 'Kevin Durant',
            'team': 'PHX',
            'position': 'F',
            'gamesPlayed': 75,
            'minutesPerGame': 37.2,
            'points': 27.1,
            'assists': 5.0,
            'rebounds': 6.6,
            'steals': 0.9,
            'blocks': 1.2,
            'turnovers': 3.3,
            'fieldGoalPercentage': 0.523,
            'threePointPercentage': 0.413,
            'freeThrowPercentage': 0.856,
            'plusMinus': 3.4
        },
        {
            'playerId': 203076,
            'name': 'Anthony Davis',
            'team': 'LAL',
            'position': 'F-C',
            'gamesPlayed': 76,
            'minutesPerGame': 35.5,
            'points': 24.7,
            'assists': 3.5,
            'rebounds': 12.6,
            'steals': 1.2,
            'blocks': 2.3,
            'turnovers': 2.0,
            'fieldGoalPercentage': 0.559,
            'threePointPercentage': 0.270,
            'freeThrowPercentage': 0.818,
            'plusMinus': 6.1
        },
        {
            'playerId': 201935,
            'name': 'James Harden',
            'team': 'LAC',
            'position': 'G',
            'gamesPlayed': 72,
            'minutesPerGame': 35.0,
            'points': 16.6,
            'assists': 8.5,
            'rebounds': 5.1,
            'steals': 1.1,
            'blocks': 0.6,
            'turnovers': 3.4,
            'fieldGoalPercentage': 0.427,
            'threePointPercentage': 0.385,
            'freeThrowPercentage': 0.874,
            'plusMinus': 2.3
        },
        {
            'playerId': 1628369,
            'name': 'Jayson Tatum',
            'team': 'BOS',
            'position': 'F',
            'gamesPlayed': 74,
            'minutesPerGame': 35.8,
            'points': 26.9,
            'assists': 4.9,
            'rebounds': 8.1,
            'steals': 1.0,
            'blocks': 0.6,
            'turnovers': 2.5,
            'fieldGoalPercentage': 0.472,
            'threePointPercentage': 0.378,
            'freeThrowPercentage': 0.831,
            'plusMinus': 7.2
        },
        {
            'playerId': 203999,
            'name': 'Nikola Jokic',
            'team': 'DEN',
            'position': 'C',
            'gamesPlayed': 79,
            'minutesPerGame': 34.6,
            'points': 29.7,
            'assists': 13.7,
            'rebounds': 13.7,
            'steals': 1.3,
            'blocks': 0.9,
            'turnovers': 4.1,
            'fieldGoalPercentage': 0.583,
            'threePointPercentage': 0.356,
            'freeThrowPercentage': 0.810,
            'plusMinus': 9.1
        },
        {
            'playerId': 203507,
            'name': 'Giannis Antetokounmpo',
            'team': 'MIL',
            'position': 'F',
            'gamesPlayed': 73,
            'minutesPerGame': 35.2,
            'points': 30.4,
            'assists': 6.5,
            'rebounds': 11.5,
            'steals': 1.2,
            'blocks': 1.1,
            'turnovers': 3.4,
            'fieldGoalPercentage': 0.612,
            'threePointPercentage': 0.274,
            'freeThrowPercentage': 0.658,
            'plusMinus': 6.8
        }
    ]
    return players

if __name__ == "__main__":
    players_data = get_sample_nba_players()
    print(json.dumps(players_data))