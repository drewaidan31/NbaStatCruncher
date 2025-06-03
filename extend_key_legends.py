#!/usr/bin/env python3

import json
import sys
import os

try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    from nba_api.stats.static import players as nba_players
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def extend_key_legends_careers():
    """Extend careers of key NBA legends already in database back to 1996"""
    
    # Load existing dataset
    try:
        with open('server/extended_players.json', 'r') as f:
            existing_data = json.load(f)
            print(f"Loaded {len(existing_data)} existing players")
    except:
        existing_data = []
        print("No existing data found")
    
    # Convert to dictionary for easier lookup
    players_dict = {player['playerId']: player for player in existing_data}
    
    # Define key legends to extend with their NBA API player IDs
    key_legends = {
        2544: 'LeBron James',      # Already has full career
        977: 'Kobe Bryant',        # Already has career data
        1495: 'Tim Duncan',        # Needs extension
        708: 'Kevin Garnett',      # Needs extension
        1718: 'Paul Pierce',       # Needs extension
        2199: 'Vince Carter',      # Needs extension
        959: 'Dirk Nowitzki',      # Needs extension
        2746: 'Dwyane Wade',       # Needs extension
        201142: 'Kevin Durant',    # Needs extension
        101108: 'Chris Paul',      # Needs extension
        201935: 'James Harden',    # Needs extension
        201566: 'Russell Westbrook' # Needs extension
    }
    
    # All historical seasons to check
    historical_seasons = [
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
        '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', 
        '1997-98', '1996-97'
    ]
    
    total_seasons_added = 0
    
    # For each key legend, search for their historical seasons
    for player_id, player_name in key_legends.items():
        if player_id not in players_dict:
            print(f"Player {player_name} not found in database, skipping...")
            continue
            
        player = players_dict[player_id]
        print(f"\nExtending {player_name}...")
        
        # Check current earliest season
        existing_seasons = [s['season'] for s in player.get('seasons', [])]
        if not existing_seasons:
            print(f"No seasons found for {player_name}, skipping...")
            continue
            
        earliest_season = min(existing_seasons)
        print(f"Current earliest season: {earliest_season}")
        
        seasons_added = 0
        
        for season in historical_seasons:
            # Skip if season is newer than earliest existing season
            if season >= earliest_season:
                continue
                
            try:
                # Get all players from this season
                player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                    season=season,
                    season_type_all_star='Regular Season'
                )
                
                df = player_stats.get_data_frames()[0]
                
                # Look for this specific player by ID
                player_row = df[df['PLAYER_ID'] == player_id]
                
                if not player_row.empty:
                    row = player_row.iloc[0]
                    games_played = int(row['GP'])
                    
                    # Only add if they played meaningful minutes (10+ games)
                    if games_played >= 10:
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
                        
                        # Add to player's seasons
                        players_dict[player_id]['seasons'].append(season_data)
                        if 'availableSeasons' not in players_dict[player_id]:
                            players_dict[player_id]['availableSeasons'] = []
                        players_dict[player_id]['availableSeasons'].append(season)
                        seasons_added += 1
                        total_seasons_added += 1
                        print(f"  Added {season}: {season_data['points']:.1f} PPG, {games_played} GP")
            
            except Exception as e:
                # Skip seasons that cause errors (player not in league yet)
                continue
        
        if seasons_added > 0:
            print(f"  Total seasons added for {player_name}: {seasons_added}")
        else:
            print(f"  No new historical seasons found for {player_name}")
    
    print(f"\nTotal historical seasons added: {total_seasons_added}")
    
    # Recalculate career stats for extended players
    print("Recalculating career statistics...")
    
    for player_id, player_data in players_dict.items():
        if 'seasons' in player_data and len(player_data['seasons']) > 1:
            seasons = player_data['seasons']
            seasons.sort(key=lambda x: x['season'], reverse=True)
            
            # Update availableSeasons
            player_data['availableSeasons'] = sorted([s['season'] for s in seasons])
            
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
                'fieldGoalAttempts': 0,
                'threePointAttempts': 0,
                'freeThrowAttempts': 0,
                'winPercentage': 0
            })
    
    # Convert back to list and save
    final_data = list(players_dict.values())
    
    # Sort by career points
    final_data.sort(key=lambda x: x.get('points', 0) * x.get('gamesPlayed', 0), reverse=True)
    
    print(f"Saving extended dataset with {len(final_data)} players...")
    
    with open('server/extended_players.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    
    # Show extended career stats for key legends
    print("\nExtended career summaries:")
    for legend_id, legend_name in key_legends.items():
        player = players_dict.get(legend_id)
        if player:
            seasons = player.get('availableSeasons', [])
            if seasons:
                earliest = min(seasons)
                latest = max(seasons)
                total_games = player.get('gamesPlayed', 0)
                ppg = player.get('points', 0)
                print(f"  {player['name']}: {len(seasons)} seasons ({earliest} to {latest}) - {total_games} GP, {ppg:.1f} PPG")

if __name__ == "__main__":
    extend_key_legends_careers()