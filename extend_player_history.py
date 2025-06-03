#!/usr/bin/env python3

import json
import sys
import os
sys.path.append('/home/runner/workspace/server')

try:
    from nba_api.stats.endpoints import leaguedashplayerstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False
    print("NBA API not available")
    sys.exit(1)

def get_current_players():
    """Get current players from the database"""
    try:
        response = os.popen('curl -s "http://localhost:5000/api/nba/players"').read()
        current_players = json.loads(response)
        print(f"Found {len(current_players)} current players")
        return current_players
    except Exception as e:
        print(f"Error fetching current players: {e}")
        return []

def extend_player_histories():
    """Add historical seasons (1996-2010) to existing players"""
    
    current_players = get_current_players()
    if not current_players:
        return []
    
    # Create a lookup by player name and ID
    player_lookup = {}
    for player in current_players:
        player_lookup[player['name']] = player
        player_lookup[player['playerId']] = player
    
    # Historical seasons to add
    historical_seasons = ['2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
                         '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', 
                         '1997-98', '1996-97']
    
    players_extended = 0
    total_seasons_added = 0
    
    for season in historical_seasons:
        print(f"Processing {season}...")
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = player_stats.get_data_frames()[0]
            
            # Filter for meaningful contributors
            df = df[(df['GP'] >= 10) & (df['PTS'] >= 3)]
            
            for _, row in df.iterrows():
                player_name = row['PLAYER_NAME']
                player_id = int(row['PLAYER_ID'])
                
                # Check if this player exists in our current dataset
                current_player = None
                if player_name in player_lookup:
                    current_player = player_lookup[player_name]
                elif player_id in player_lookup:
                    current_player = player_lookup[player_id]
                
                if current_player:
                    # Check if this season is already in their data
                    existing_seasons = {s['season'] for s in current_player.get('seasons', [])}
                    
                    if season not in existing_seasons:
                        # Add this historical season to the player
                        games_played = int(row['GP']) if row['GP'] > 0 else 1
                        
                        historical_season = {
                            'season': season,
                            'team': row['TEAM_ABBREVIATION'],
                            'position': current_player.get('position', 'G'),
                            'gamesPlayed': games_played,
                            'minutesPerGame': float(row['MIN']) / games_played,
                            'points': float(row['PTS']) / games_played,
                            'assists': float(row['AST']) / games_played,
                            'rebounds': float(row['REB']) / games_played,
                            'steals': float(row['STL']) / games_played,
                            'blocks': float(row['BLK']) / games_played,
                            'turnovers': float(row['TOV']) / games_played,
                            'fieldGoalPercentage': float(row['FG_PCT']) if row['FG_PCT'] else 0.0,
                            'threePointPercentage': float(row['FG3_PCT']) if row['FG3_PCT'] else 0.0,
                            'freeThrowPercentage': float(row['FT_PCT']) if row['FT_PCT'] else 0.0,
                            'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0
                        }
                        
                        # Add to the player's seasons
                        if 'seasons' not in current_player:
                            current_player['seasons'] = []
                        
                        current_player['seasons'].append(historical_season)
                        total_seasons_added += 1
                        
                        # Count unique players extended
                        if len([s for s in current_player['seasons'] if s['season'] < '2010-11']) == 1:
                            players_extended += 1
                            
        except Exception as e:
            print(f"Error processing {season}: {e}")
            continue
    
    print(f"\nExtension complete:")
    print(f"- {players_extended} players now have historical data")
    print(f"- {total_seasons_added} historical seasons added total")
    
    # Recalculate career stats for extended players
    for player in current_players:
        if 'seasons' in player and len(player['seasons']) > 0:
            # Sort seasons by year (most recent first)
            player['seasons'].sort(key=lambda x: x['season'], reverse=True)
            
            # Recalculate career averages
            total_games = sum(s['gamesPlayed'] for s in player['seasons'])
            total_minutes = sum(s['minutesPerGame'] * s['gamesPlayed'] for s in player['seasons'])
            total_points = sum(s['points'] * s['gamesPlayed'] for s in player['seasons'])
            total_assists = sum(s['assists'] * s['gamesPlayed'] for s in player['seasons'])
            total_rebounds = sum(s['rebounds'] * s['gamesPlayed'] for s in player['seasons'])
            total_steals = sum(s['steals'] * s['gamesPlayed'] for s in player['seasons'])
            total_blocks = sum(s['blocks'] * s['gamesPlayed'] for s in player['seasons'])
            total_turnovers = sum(s['turnovers'] * s['gamesPlayed'] for s in player['seasons'])
            total_plus_minus = sum(s['plusMinus'] * s['gamesPlayed'] for s in player['seasons'])
            
            # Update career stats
            if total_games > 0:
                player['gamesPlayed'] = total_games
                player['minutesPerGame'] = total_minutes / total_games
                player['points'] = total_points / total_games
                player['assists'] = total_assists / total_games
                player['rebounds'] = total_rebounds / total_games
                player['steals'] = total_steals / total_games
                player['blocks'] = total_blocks / total_games
                player['turnovers'] = total_turnovers / total_games
                player['plusMinus'] = total_plus_minus / total_games
                
                # Update available seasons list
                player['availableSeasons'] = [s['season'] for s in player['seasons']]
    
    return current_players

if __name__ == "__main__":
    print("Extending current players with historical seasons (1996-2010)...")
    
    extended_players = extend_player_histories()
    
    if extended_players:
        # Save the extended dataset
        with open('extended_players.json', 'w') as f:
            json.dump(extended_players, f, indent=2)
        
        print(f"\n✓ Extended dataset saved to extended_players.json")
        print(f"Total players: {len(extended_players)}")
        
        # Show some examples of extended players
        extended_examples = [p for p in extended_players if len(p.get('seasons', [])) > 10]
        if extended_examples:
            print(f"\nPlayers with extensive historical data (>10 seasons):")
            for player in extended_examples[:5]:
                seasons = player.get('seasons', [])
                earliest = min(s['season'] for s in seasons)
                latest = max(s['season'] for s in seasons)
                print(f"  {player['name']}: {len(seasons)} seasons ({earliest} to {latest})")
    else:
        print("✗ Failed to extend player histories")