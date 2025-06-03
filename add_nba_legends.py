#!/usr/bin/env python3

import json
import sys
import os

try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    from nba_api.stats.static import players
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def add_key_nba_legends():
    """Add key NBA legends from 1996-2009 to the dataset"""
    
    # Load existing data
    try:
        with open('server/extended_players.json', 'r') as f:
            existing_data = json.load(f)
            print(f"Loaded {len(existing_data)} existing players")
    except:
        existing_data = []
        print("No existing data found")
    
    # Convert to dictionary for easier lookup
    existing_players = {player['playerId']: player for player in existing_data}
    existing_names = {player['name'].lower() for player in existing_data}
    
    # Key historical seasons to sample (focusing on peak years)
    key_seasons = ['2002-03', '2001-02', '2000-01', '1999-00', '1998-99', '1997-98']
    
    legends_added = 0
    
    for season in key_seasons:
        print(f"Sampling legends from {season}...")
        try:
            # Get top performers from this season
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for top performers (high PPG and significant games)
            df = df[(df['GP'] >= 40) & (df['PTS'] >= df['GP'] * 15)]
            df = df.sort_values('PTS', ascending=False).head(30)  # Top 30 scorers
            
            print(f"  Found {len(df)} top performers")
            
            for _, row in df.iterrows():
                player_id = int(row['PLAYER_ID'])
                player_name = row['PLAYER_NAME']
                games_played = int(row['GP'])
                
                # Skip if player already exists
                if player_name.lower() in existing_names:
                    continue
                
                # Create comprehensive player data
                season_data = {
                    'season': season,
                    'team': row['TEAM_ABBREVIATION'],
                    'position': 'G',
                    'gamesPlayed': games_played,
                    'minutesPerGame': float(row['MIN']) / games_played,
                    'points': float(row['PTS']) / games_played,
                    'assists': float(row['AST']) / games_played,
                    'rebounds': float(row['REB']) / games_played,
                    'steals': float(row['STL']) / games_played,
                    'blocks': float(row['BLK']) / games_played,
                    'turnovers': float(row['TOV']) / games_played,
                    'fieldGoalPercentage': float(row['FG_PCT']) if row['FG_PCT'] else 0.0,
                    'fieldGoalAttempts': float(row['FGA']) / games_played if row['FGA'] else 0.0,
                    'threePointPercentage': float(row['FG3_PCT']) if row['FG3_PCT'] else 0.0,
                    'threePointAttempts': float(row['FG3A']) / games_played if row['FG3A'] else 0.0,
                    'freeThrowPercentage': float(row['FT_PCT']) if row['FT_PCT'] else 0.0,
                    'freeThrowAttempts': float(row['FTA']) / games_played if row['FTA'] else 0.0,
                    'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0,
                    'winPercentage': float(row['W_PCT']) if row['W_PCT'] else 0.0
                }
                
                # Create new player entry
                new_player = {
                    'playerId': player_id,
                    'name': player_name,
                    'seasons': [season_data],
                    'currentSeason': season,
                    'team': season_data['team'],
                    'position': season_data['position'],
                    'gamesPlayed': games_played,
                    'minutesPerGame': season_data['minutesPerGame'],
                    'points': season_data['points'],
                    'assists': season_data['assists'],
                    'rebounds': season_data['rebounds'],
                    'steals': season_data['steals'],
                    'blocks': season_data['blocks'],
                    'turnovers': season_data['turnovers'],
                    'fieldGoalPercentage': season_data['fieldGoalPercentage'],
                    'fieldGoalAttempts': season_data['fieldGoalAttempts'],
                    'threePointPercentage': season_data['threePointPercentage'],
                    'threePointAttempts': season_data['threePointAttempts'],
                    'freeThrowPercentage': season_data['freeThrowPercentage'],
                    'freeThrowAttempts': season_data['freeThrowAttempts'],
                    'plusMinus': season_data['plusMinus'],
                    'winPercentage': season_data['winPercentage'],
                    'availableSeasons': [season]
                }
                
                existing_data.append(new_player)
                existing_names.add(player_name.lower())
                legends_added += 1
                
                print(f"    Added: {player_name} ({season_data['points']:.1f} PPG)")
                
                # Limit to avoid too many additions per season
                if legends_added >= 50:
                    break
            
            if legends_added >= 50:
                break
                
        except Exception as e:
            print(f"  Error processing {season}: {e}")
            continue
    
    print(f"\nAdded {legends_added} NBA legends")
    
    # Save updated dataset
    with open('server/extended_players.json', 'w') as f:
        json.dump(existing_data, f, indent=2)
    
    print(f"Updated dataset saved with {len(existing_data)} total players")
    
    # Verify some famous players are included
    famous_names = ['kobe', 'jordan', 'shaq', 'duncan', 'iverson', 'garnett', 'carter']
    for name in famous_names:
        matching_players = [p for p in existing_data if name in p['name'].lower()]
        if matching_players:
            for player in matching_players:
                seasons = player.get('availableSeasons', [player.get('currentSeason', '')])
                print(f"Found: {player['name']} - {len(seasons)} seasons")
        else:
            print(f"Missing: {name}")

if __name__ == "__main__":
    add_key_nba_legends()