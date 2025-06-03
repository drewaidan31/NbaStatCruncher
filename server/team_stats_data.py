#!/usr/bin/env python3

import json
import sys
try:
    from nba_api.stats.endpoints import leaguedashteamstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False

def get_team_possession_data(season='2024-25'):
    """Get team statistics including calculated possession data"""
    if not NBA_API_AVAILABLE:
        return None
        
    try:
        # Get team stats from NBA API
        team_stats = leaguedashteamstats.LeagueDashTeamStats(season=season)
        df = team_stats.get_data_frames()[0]
        
        teams_data = []
        total_possessions_per_game = 0
        total_pace = 0
        total_offensive_rating = 0
        
        for _, row in df.iterrows():
            games = row['GP']
            if games == 0:
                continue
                
            # Calculate possessions using standard formula
            # Possessions = FGA + 0.44 * FTA - OREB + TOV
            possessions = row['FGA'] + (0.44 * row['FTA']) - row['OREB'] + row['TOV']
            possessions_per_game = possessions / games
            
            # Calculate pace (possessions per 48 minutes)
            total_minutes = row['MIN']
            pace = (possessions * 48) / total_minutes if total_minutes > 0 else 0
            
            # Calculate offensive rating (points per 100 possessions)
            offensive_rating = (row['PTS'] / possessions) * 100 if possessions > 0 else 0
            
            team_data = {
                'teamId': int(row['TEAM_ID']),
                'teamName': row['TEAM_NAME'],
                'gamesPlayed': int(games),
                'wins': int(row['W']),
                'losses': int(row['L']),
                'winPercentage': float(row['W_PCT']),
                'points': int(row['PTS']),
                'pointsPerGame': float(row['PTS']) / games,
                'fieldGoalAttempts': int(row['FGA']),
                'freeThrowAttempts': int(row['FTA']),
                'offensiveRebounds': int(row['OREB']),
                'turnovers': float(row['TOV']),
                'possessions': round(possessions),
                'possessionsPerGame': round(possessions_per_game, 1),
                'pace': round(pace, 1),
                'offensiveRating': round(offensive_rating, 1),
                'defensiveRating': 110.0,  # Would need opponent data for accurate calculation
                'assists': float(row['AST']),
                'rebounds': float(row['REB']),
                'steals': float(row['STL']),
                'blocks': float(row['BLK']),
                'fieldGoalPercentage': float(row['FG_PCT']),
                'threePointPercentage': float(row['FG3_PCT']),
                'freeThrowPercentage': float(row['FT_PCT']),
                'plusMinus': float(row['PLUS_MINUS'])
            }
            
            teams_data.append(team_data)
            total_possessions_per_game += possessions_per_game
            total_pace += pace
            total_offensive_rating += offensive_rating
        
        # Calculate league averages
        num_teams = len(teams_data)
        league_average = {
            'possessionsPerGame': round(total_possessions_per_game / num_teams, 1) if num_teams > 0 else 0,
            'pace': round(total_pace / num_teams, 1) if num_teams > 0 else 0,
            'offensiveRating': round(total_offensive_rating / num_teams, 1) if num_teams > 0 else 0,
            'defensiveRating': 110.0
        }
        
        # Sort teams by wins
        teams_data.sort(key=lambda x: x['wins'], reverse=True)
        
        return {
            'teams': teams_data,
            'leagueAverage': league_average
        }
        
    except Exception as e:
        print(f"Error fetching team data: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    season = sys.argv[1] if len(sys.argv) > 1 else '2024-25'
    
    data = get_team_possession_data(season)
    if data:
        print(json.dumps(data))
    else:
        print("null")