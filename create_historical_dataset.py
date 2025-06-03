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

def create_comprehensive_historical_dataset():
    """Create a comprehensive dataset including NBA legends from 1996-2025"""
    
    # Load existing modern data
    try:
        with open('server/extended_players.json', 'r') as f:
            existing_data = json.load(f)
            print(f"Loaded {len(existing_data)} existing players")
    except:
        existing_data = []
        print("No existing data found, starting fresh")
    
    # Convert to dictionary for easier lookup
    existing_players = {player['playerId']: player for player in existing_data}
    
    # Historical seasons to add (1996-2009)
    historical_seasons = [
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
        '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', 
        '1997-98', '1996-97'
    ]
    
    print(f"Fetching historical data from {len(historical_seasons)} seasons...")
    
    for season in historical_seasons:
        print(f"Processing {season}...")
        try:
            # Get player stats for this historical season
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for meaningful contributors (at least 20 games, 8+ PPG)
            df = df[(df['GP'] >= 20) & (df['PTS'] >= df['GP'] * 8)]
            
            print(f"  Found {len(df)} players in {season}")
            
            for _, row in df.iterrows():
                player_id = int(row['PLAYER_ID'])
                player_name = row['PLAYER_NAME']
                games_played = int(row['GP'])
                
                # Create season data
                season_data = {
                    'season': season,
                    'team': row['TEAM_ABBREVIATION'],
                    'position': 'G',  # Default position
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
                
                # Add to existing player or create new entry
                if player_id in existing_players:
                    # Add this season to existing player
                    if 'seasons' not in existing_players[player_id]:
                        existing_players[player_id]['seasons'] = []
                    existing_players[player_id]['seasons'].append(season_data)
                else:
                    # Create new player entry
                    existing_players[player_id] = {
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
                        'winPercentage': season_data['winPercentage']
                    }
            
        except Exception as e:
            print(f"  Error processing {season}: {e}")
            continue
    
    # Recalculate career stats for all players with multiple seasons
    print("Recalculating career statistics...")
    
    for player_id, player_data in existing_players.items():
        if 'seasons' in player_data and len(player_data['seasons']) > 1:
            seasons = player_data['seasons']
            
            # Sort seasons by year (most recent first)
            seasons.sort(key=lambda x: x['season'], reverse=True)
            
            # Calculate career totals
            total_games = sum(s['gamesPlayed'] for s in seasons)
            total_minutes = sum(s['minutesPerGame'] * s['gamesPlayed'] for s in seasons)
            total_points = sum(s['points'] * s['gamesPlayed'] for s in seasons)
            total_assists = sum(s['assists'] * s['gamesPlayed'] for s in seasons)
            total_rebounds = sum(s['rebounds'] * s['gamesPlayed'] for s in seasons)
            total_steals = sum(s['steals'] * s['gamesPlayed'] for s in seasons)
            total_blocks = sum(s['blocks'] * s['gamesPlayed'] for s in seasons)
            total_turnovers = sum(s['turnovers'] * s['gamesPlayed'] for s in seasons)
            total_plus_minus = sum(s['plusMinus'] * s['gamesPlayed'] for s in seasons)
            
            # Calculate weighted averages for percentages
            fg_pct_seasons = [s for s in seasons if s['fieldGoalPercentage'] > 0]
            three_pct_seasons = [s for s in seasons if s['threePointPercentage'] > 0]
            ft_pct_seasons = [s for s in seasons if s['freeThrowPercentage'] > 0]
            
            avg_fg_pct = sum(s['fieldGoalPercentage'] for s in fg_pct_seasons) / len(fg_pct_seasons) if fg_pct_seasons else 0.0
            avg_three_pct = sum(s['threePointPercentage'] for s in three_pct_seasons) / len(three_pct_seasons) if three_pct_seasons else 0.0
            avg_ft_pct = sum(s['freeThrowPercentage'] for s in ft_pct_seasons) / len(ft_pct_seasons) if ft_pct_seasons else 0.0
            
            # Update career averages
            latest_season = seasons[0]
            player_data.update({
                'currentSeason': latest_season['season'],
                'team': latest_season['team'],
                'position': latest_season['position'],
                'gamesPlayed': total_games,
                'minutesPerGame': total_minutes / total_games if total_games > 0 else 0.0,
                'points': total_points / total_games if total_games > 0 else 0.0,
                'assists': total_assists / total_games if total_games > 0 else 0.0,
                'rebounds': total_rebounds / total_games if total_games > 0 else 0.0,
                'steals': total_steals / total_games if total_games > 0 else 0.0,
                'blocks': total_blocks / total_games if total_games > 0 else 0.0,
                'turnovers': total_turnovers / total_games if total_games > 0 else 0.0,
                'fieldGoalPercentage': avg_fg_pct,
                'threePointPercentage': avg_three_pct,
                'freeThrowPercentage': avg_ft_pct,
                'plusMinus': total_plus_minus / total_games if total_games > 0 else 0.0,
                'availableSeasons': [s['season'] for s in seasons]
            })
    
    # Convert back to list and save
    comprehensive_data = list(existing_players.values())
    
    # Sort by career points (highest first)
    comprehensive_data.sort(key=lambda x: x.get('points', 0) * x.get('gamesPlayed', 0), reverse=True)
    
    print(f"Saving comprehensive dataset with {len(comprehensive_data)} players...")
    
    # Save to new file
    with open('server/extended_players_with_historical.json', 'w') as f:
        json.dump(comprehensive_data, f, indent=2)
    
    # Also update the main file
    with open('server/extended_players.json', 'w') as f:
        json.dump(comprehensive_data, f, indent=2)
    
    # Print some statistics
    historical_players = [p for p in comprehensive_data if any(s.get('season', '').startswith('199') or s.get('season', '').startswith('200') for s in p.get('seasons', []))]
    print(f"Total players: {len(comprehensive_data)}")
    print(f"Players with historical seasons (1990s-2000s): {len(historical_players)}")
    
    # Show some famous historical players
    famous_names = ['Michael Jordan', 'Kobe Bryant', 'Shaquille O\'Neal', 'Tim Duncan', 'Allen Iverson']
    for name in famous_names:
        player = next((p for p in comprehensive_data if name.lower() in p['name'].lower()), None)
        if player:
            seasons = [s['season'] for s in player.get('seasons', [])]
            print(f"  {player['name']}: {len(seasons)} seasons ({min(seasons)} to {max(seasons)})")
    
    return comprehensive_data

if __name__ == "__main__":
    create_comprehensive_historical_dataset()