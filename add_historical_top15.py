#!/usr/bin/env python3

import json
import sys
import os

try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def add_top15_historical_players():
    """Add top 15 players from each season 1996-2010"""
    
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
    
    # Historical seasons 1996-2010
    historical_seasons = [
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
        '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', 
        '1997-98', '1996-97'
    ]
    
    total_added = 0
    
    for season in historical_seasons:
        print(f"Processing {season}...")
        try:
            # Get player stats for this season
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for meaningful contributors and get top 15 by total points
            df = df[df['GP'] >= 30]  # At least 30 games
            df = df.sort_values('PTS', ascending=False).head(15)  # Top 15 by total points
            
            season_added = 0
            
            for _, row in df.iterrows():
                player_id = int(row['PLAYER_ID'])
                player_name = row['PLAYER_NAME']
                games_played = int(row['GP'])
                
                if games_played == 0:
                    continue
                
                # Create season data
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
                
                # Add season to existing player or create new player
                if player_id in existing_players:
                    # Add season to existing player
                    if 'seasons' not in existing_players[player_id]:
                        existing_players[player_id]['seasons'] = []
                    
                    # Check if this season already exists
                    existing_seasons = [s['season'] for s in existing_players[player_id]['seasons']]
                    if season not in existing_seasons:
                        existing_players[player_id]['seasons'].append(season_data)
                        
                        # Update available seasons
                        if 'availableSeasons' not in existing_players[player_id]:
                            existing_players[player_id]['availableSeasons'] = []
                        existing_players[player_id]['availableSeasons'].append(season)
                        existing_players[player_id]['availableSeasons'] = sorted(list(set(existing_players[player_id]['availableSeasons'])))
                else:
                    # Create new player
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
                    existing_players[player_id] = new_player
                
                season_added += 1
                total_added += 1
                print(f"  {player_name}: {season_data['points']:.1f} PPG")
            
            print(f"  Added {season_added} players from {season}")
            
        except Exception as e:
            print(f"  Error processing {season}: {e}")
            continue
    
    print(f"\nTotal historical seasons added: {total_added}")
    
    # Recalculate career stats for players with multiple seasons
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
    final_data = list(existing_players.values())
    
    # Save updated dataset
    with open('server/extended_players.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"Updated dataset saved with {len(final_data)} total players")
    
    # Show some famous historical players now included
    historical_legends = [p for p in final_data if any(s.get('season', '').startswith('199') or s.get('season', '').startswith('200') for s in p.get('seasons', []))]
    print(f"Players with historical seasons (1990s-2000s): {len(historical_legends)}")
    
    # Check for specific legends
    legend_names = ['Jordan', 'Bryant', 'O\'Neal', 'Duncan', 'Iverson', 'Garnett', 'Carter', 'McGrady', 'Webber']
    print("\nLegends found:")
    for legend in legend_names:
        matching = [p for p in final_data if legend.lower() in p['name'].lower()]
        for player in matching:
            seasons = player.get('availableSeasons', [])
            if seasons:
                earliest = min(seasons)
                latest = max(seasons)
                print(f"  {player['name']}: {len(seasons)} seasons ({earliest} to {latest})")

if __name__ == "__main__":
    add_top15_historical_players()