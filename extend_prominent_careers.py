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

def extend_prominent_player_careers():
    """Extend careers of prominent players back to 1996"""
    
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
    
    # Identify prominent players who likely have pre-2010 careers
    prominent_players = []
    for player in existing_data:
        # Look for players with long careers (15+ seasons) or high career stats
        seasons = player.get('availableSeasons', [])
        career_games = player.get('gamesPlayed', 0)
        career_ppg = player.get('points', 0)
        
        # Criteria for extending career:
        # 1. Players with 15+ seasons OR
        # 2. Players with 1000+ career games OR  
        # 3. Players with 20+ PPG career average OR
        # 4. Specific legendary names
        legendary_names = ['LeBron', 'Kobe', 'Duncan', 'Garnett', 'Pierce', 'Carter', 'Wade', 
                          'Nash', 'Nowitzki', 'Howard', 'Anthony', 'Paul', 'Parker',
                          'Ginobili', 'Allen', 'Wallace', 'Gasol', 'Bosh']
        
        is_prominent = (
            len(seasons) >= 15 or 
            career_games >= 1000 or 
            career_ppg >= 20 or
            any(name in player['name'] for name in legendary_names)
        )
        
        if is_prominent:
            # Check if they already have pre-2010 seasons
            earliest_season = min(seasons) if seasons else '2024-25'
            if earliest_season >= '2010-11':
                prominent_players.append(player)
                print(f"Will extend career for: {player['name']} (current: {earliest_season}-{max(seasons)})")
    
    print(f"\nFound {len(prominent_players)} prominent players to extend")
    
    # All historical seasons to check
    historical_seasons = [
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
        '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', 
        '1997-98', '1996-97'
    ]
    
    total_seasons_added = 0
    
    # For each prominent player, search for their historical seasons
    for player in prominent_players:
        player_id = player['playerId']
        player_name = player['name']
        
        print(f"\nExtending {player_name}...")
        seasons_added = 0
        
        for season in historical_seasons:
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
                    
                    # Only add if they played meaningful minutes (20+ games)
                    if games_played >= 20:
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
                        
                        # Add to player's seasons if not already present
                        existing_seasons = [s['season'] for s in player['seasons']]
                        if season not in existing_seasons:
                            players_dict[player_id]['seasons'].append(season_data)
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
            print(f"  No historical seasons found for {player_name}")
    
    print(f"\nTotal historical seasons added: {total_seasons_added}")
    
    # Recalculate career stats for extended players
    print("Recalculating career statistics...")
    
    for player_id, player_data in players_dict.items():
        if 'seasons' in player_data and len(player_data['seasons']) > 1:
            seasons = player_data['seasons']
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
                'availableSeasons': sorted([s['season'] for s in seasons])
            })
    
    # Convert back to list and save
    final_data = list(players_dict.values())
    
    # Sort by career points
    final_data.sort(key=lambda x: x.get('points', 0) * x.get('gamesPlayed', 0), reverse=True)
    
    print(f"Saving extended dataset with {len(final_data)} players...")
    
    with open('server/extended_players.json', 'w') as f:
        json.dump(final_data, f, indent=2)
    
    # Show extended career stats
    print("\nExtended career summaries:")
    extended_legends = ['LeBron James', 'Kobe Bryant', 'Tim Duncan', 'Kevin Garnett', 'Paul Pierce', 'Vince Carter']
    for legend in extended_legends:
        player = next((p for p in final_data if legend in p['name']), None)
        if player:
            seasons = player.get('availableSeasons', [])
            if seasons:
                earliest = min(seasons)
                latest = max(seasons)
                total_games = player.get('gamesPlayed', 0)
                ppg = player.get('points', 0)
                print(f"  {player['name']}: {len(seasons)} seasons ({earliest} to {latest}) - {total_games} GP, {ppg:.1f} PPG")

if __name__ == "__main__":
    extend_prominent_player_careers()