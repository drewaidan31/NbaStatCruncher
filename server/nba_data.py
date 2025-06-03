#!/usr/bin/env python3

import json
import sys
try:
    from nba_api.stats.static import players, teams
    from nba_api.stats.endpoints import leaguedashplayerstats
    import pandas as pd
    NBA_API_AVAILABLE = True
except ImportError:
    NBA_API_AVAILABLE = False

def get_nba_players_from_api(season='2024-25'):
    """Get NBA players using the official NBA API"""
    try:
        # Handle all-time option by combining multiple seasons
        if season == 'all-time':
            return get_all_time_leaders()
        
        # Get season player stats
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            season_type_all_star='Regular Season'
        )
        
        # Get the data and convert to dataframe
        df = player_stats.get_data_frames()[0]
        
        # Filter for players with at least 5 games played to include more players
        df = df[df['GP'] >= 5]
        
        # Sort by points per game descending
        df = df.sort_values('PTS', ascending=False)
        
        # Take top 200 players instead of 100
        df = df.head(200)
        
        players_data = []
        for _, row in df.iterrows():
            games_played = int(row['GP']) if row['GP'] > 0 else 1  # Avoid division by zero
            
            player_data = {
                'playerId': int(row['PLAYER_ID']),
                'name': row['PLAYER_NAME'],
                'team': row['TEAM_ABBREVIATION'],
                'position': 'G',  # Default, NBA API doesn't provide position in this endpoint
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
            players_data.append(player_data)
        
        return players_data
    except Exception as e:
        print(f"Error fetching from NBA API: {e}", file=sys.stderr)
        return None

def get_historical_legends():
    """Get top 100 historical players from 1996-2010"""
    try:
        # Sample key historical seasons to identify legends
        historical_sample_seasons = ['2009-10', '2007-08', '2005-06', '2002-03', '1999-00', '1996-97']
        
        # Identify top players from these seasons
        legend_candidates = {}
        
        for season in historical_sample_seasons:
            try:
                player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                    season=season,
                    season_type_all_star='Regular Season'
                )
                
                df = player_stats.get_data_frames()[0]
                df = df[(df['GP'] >= 20) & (df['PTS'] >= 10)]  # Meaningful players only
                df = df.sort_values('PTS', ascending=False).head(25)  # Top 25 per season
                
                for _, row in df.iterrows():
                    player_name = row['PLAYER_NAME']
                    player_id = int(row['PLAYER_ID'])
                    ppg = float(row['PTS']) / float(row['GP'])
                    
                    if player_name not in legend_candidates:
                        legend_candidates[player_name] = {
                            'playerId': player_id,
                            'name': player_name,
                            'peak_ppg': ppg
                        }
                    elif ppg > legend_candidates[player_name]['peak_ppg']:
                        legend_candidates[player_name]['peak_ppg'] = ppg
                        
            except Exception as e:
                print(f"Error sampling {season}: {e}", file=sys.stderr)
                continue
        
        # Take top 100 legends by peak performance
        top_legends = sorted(legend_candidates.values(), 
                           key=lambda x: x['peak_ppg'], reverse=True)[:100]
        
        print(f"Identified {len(top_legends)} historical legends", file=sys.stderr)
        
        # Now fetch complete career data for these legends
        historical_seasons = ['2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
                             '2003-04', '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', '1997-98', '1996-97']
        
        legends_with_careers = {}
        
        for season in historical_seasons:
            try:
                player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                    season=season,
                    season_type_all_star='Regular Season'
                )
                
                df = player_stats.get_data_frames()[0]
                df = df[df['GP'] >= 5]
                
                for _, row in df.iterrows():
                    player_id = int(row['PLAYER_ID'])
                    player_name = row['PLAYER_NAME']
                    
                    # Only process if this player is in our top 100 legends
                    if any(legend['playerId'] == player_id for legend in top_legends):
                        games_played = int(row['GP']) if row['GP'] > 0 else 1
                        
                        season_stats = {
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
                            'threePointPercentage': float(row['FG3_PCT']) if row['FG3_PCT'] else 0.0,
                            'freeThrowPercentage': float(row['FT_PCT']) if row['FT_PCT'] else 0.0,
                            'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0
                        }
                        
                        if player_name not in legends_with_careers:
                            legends_with_careers[player_name] = {
                                'playerId': player_id,
                                'name': player_name,
                                'seasons': []
                            }
                        
                        legends_with_careers[player_name]['seasons'].append(season_stats)
                        
            except Exception as e:
                print(f"Error processing historical season {season}: {e}", file=sys.stderr)
                continue
        
        # Filter legends who have multiple seasons and return as list
        qualified_legends = [data for data in legends_with_careers.values() 
                           if len(data['seasons']) >= 2]
        
        print(f"Historical legends with career data: {len(qualified_legends)}", file=sys.stderr)
        return qualified_legends
        
    except Exception as e:
        print(f"Error fetching historical legends: {e}", file=sys.stderr)
        return []

def get_all_players_with_seasons():
    """Get all unique players with all their seasons"""
    try:
        # Check if we have extended historical data available
        import os
        extended_data_path = 'server/extended_players.json'
        
        if os.path.exists(extended_data_path):
            print("Using extended historical dataset...", file=sys.stderr)
            with open(extended_data_path, 'r') as f:
                extended_players = json.load(f)
            print(f"Loaded {len(extended_players)} players with extended historical data", file=sys.stderr)
            return extended_players
        
        # Fallback to modern seasons only if extended data not available
        print("Extended data not found, using modern seasons only...", file=sys.stderr)
        modern_seasons = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', 
                         '2018-19', '2017-18', '2016-17', '2015-16', '2014-15',
                         '2013-14', '2012-13', '2011-12', '2010-11']
        
        all_players = {}  # Dictionary to store all seasons for each player
        
        print(f"Fetching players from {len(modern_seasons)} seasons...", file=sys.stderr)
        
        for season in modern_seasons:
            try:
                player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
                    season=season,
                    season_type_all_star='Regular Season'
                )
                
                df = player_stats.get_data_frames()[0]
                df = df[df['GP'] >= 5]  # Include players with at least 5 games
                
                for _, row in df.iterrows():
                    games_played = int(row['GP']) if row['GP'] > 0 else 1
                    player_id = int(row['PLAYER_ID'])
                    player_name = row['PLAYER_NAME']
                    
                    season_stats = {
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
                        'threePointPercentage': float(row['FG3_PCT']) if row['FG3_PCT'] else 0.0,
                        'freeThrowPercentage': float(row['FT_PCT']) if row['FT_PCT'] else 0.0,
                        'plusMinus': float(row['PLUS_MINUS']) / games_played if row['PLUS_MINUS'] else 0.0
                    }
                    
                    if player_id not in all_players:
                        all_players[player_id] = {
                            'playerId': player_id,
                            'name': player_name,
                            'seasons': []
                        }
                    
                    all_players[player_id]['seasons'].append(season_stats)
                
                print(f"Processed {season}: {len(df)} players", file=sys.stderr)
                
            except Exception as e:
                print(f"Error processing season {season}: {e}", file=sys.stderr)
                continue
        
        # Convert to list and filter to players with at least one season
        players_list = []
        for player_data in all_players.values():
            if len(player_data['seasons']) > 0:
                # Sort seasons by year (most recent first)
                player_data['seasons'].sort(key=lambda x: x['season'], reverse=True)
                
                # Calculate career totals across all seasons
                total_games = sum(s['gamesPlayed'] for s in player_data['seasons'])
                total_minutes = sum(s['minutesPerGame'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_points = sum(s['points'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_assists = sum(s['assists'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_rebounds = sum(s['rebounds'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_steals = sum(s['steals'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_blocks = sum(s['blocks'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_turnovers = sum(s['turnovers'] * s['gamesPlayed'] for s in player_data['seasons'])
                total_plus_minus = sum(s['plusMinus'] * s['gamesPlayed'] for s in player_data['seasons'])
                
                # Calculate weighted averages for percentages
                fg_pct_seasons = [s for s in player_data['seasons'] if s['fieldGoalPercentage'] > 0]
                three_pct_seasons = [s for s in player_data['seasons'] if s['threePointPercentage'] > 0]
                ft_pct_seasons = [s for s in player_data['seasons'] if s['freeThrowPercentage'] > 0]
                
                avg_fg_pct = sum(s['fieldGoalPercentage'] for s in fg_pct_seasons) / len(fg_pct_seasons) if fg_pct_seasons else 0.0
                avg_three_pct = sum(s['threePointPercentage'] for s in three_pct_seasons) / len(three_pct_seasons) if three_pct_seasons else 0.0
                avg_ft_pct = sum(s['freeThrowPercentage'] for s in ft_pct_seasons) / len(ft_pct_seasons) if ft_pct_seasons else 0.0
                
                # Get latest season info for team/position
                latest_season = player_data['seasons'][0]
                
                # Set career averages as main stats
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
                    'availableSeasons': [s['season'] for s in player_data['seasons']]
                })
                players_list.append(player_data)
        
        # Sort by most recent season points
        players_list.sort(key=lambda x: x['points'], reverse=True)
        
        # Take top 500 unique players
        players_list = players_list[:500]
        
        print(f"Unique players compiled: {len(players_list)} players", file=sys.stderr)
        return players_list
        
    except Exception as e:
        print(f"Error creating player profiles: {e}", file=sys.stderr)
        return None

def get_all_time_leaders():
    """Get all-time leaders by combining data from multiple seasons"""
    try:
        # Get all players with seasons
        all_players_data = get_all_players_with_seasons()
        if not all_players_data:
            return None
            
        # Convert to old format for compatibility
        players_list = []
        for player_data in all_players_data:
            # Find best season for each player based on PPG
            best_season = max(player_data['seasons'], key=lambda x: x['points'])
            
            player_legacy = {
                'playerId': player_data['playerId'],
                'name': player_data['name'],
                'team': f"{best_season['team']} ({best_season['season']})",
                'position': best_season['position'],
                'gamesPlayed': best_season['gamesPlayed'],
                'minutesPerGame': best_season['minutesPerGame'],
                'points': best_season['points'],
                'assists': best_season['assists'],
                'rebounds': best_season['rebounds'],
                'steals': best_season['steals'],
                'blocks': best_season['blocks'],
                'turnovers': best_season['turnovers'],
                'fieldGoalPercentage': best_season['fieldGoalPercentage'],
                'threePointPercentage': best_season['threePointPercentage'],
                'freeThrowPercentage': best_season['freeThrowPercentage'],
                'plusMinus': best_season['plusMinus']
            }
            players_list.append(player_legacy)
            
        # Sort by points and take top 300
        players_list.sort(key=lambda x: x['points'], reverse=True)
        players_list = players_list[:300]
        
        print(f"All-time leaders compiled: {len(players_list)} players", file=sys.stderr)
        return players_list
        
    except Exception as e:
        print(f"Error creating all-time leaders: {e}", file=sys.stderr)
        return None

def get_sample_nba_players():
    """Get comprehensive NBA players with realistic 2024-25 statistics"""
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
        },
        {
            'playerId': 1630169,
            'name': 'Luka Doncic',
            'team': 'DAL',
            'position': 'G',
            'gamesPlayed': 70,
            'minutesPerGame': 37.5,
            'points': 32.4,
            'assists': 9.1,
            'rebounds': 8.6,
            'steals': 1.4,
            'blocks': 0.5,
            'turnovers': 4.0,
            'fieldGoalPercentage': 0.487,
            'threePointPercentage': 0.382,
            'freeThrowPercentage': 0.786,
            'plusMinus': 5.2
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
            'playerId': 1627759,
            'name': 'Jaylen Brown',
            'team': 'BOS',
            'position': 'G-F',
            'gamesPlayed': 70,
            'minutesPerGame': 35.4,
            'points': 25.0,
            'assists': 3.6,
            'rebounds': 6.1,
            'steals': 1.2,
            'blocks': 0.4,
            'turnovers': 2.8,
            'fieldGoalPercentage': 0.493,
            'threePointPercentage': 0.354,
            'freeThrowPercentage': 0.708,
            'plusMinus': 6.9
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
            'playerId': 1629029,
            'name': 'Zion Williamson',
            'team': 'NOP',
            'position': 'F',
            'gamesPlayed': 68,
            'minutesPerGame': 33.1,
            'points': 22.9,
            'assists': 5.3,
            'rebounds': 5.8,
            'steals': 1.1,
            'blocks': 0.6,
            'turnovers': 3.1,
            'fieldGoalPercentage': 0.570,
            'threePointPercentage': 0.333,
            'freeThrowPercentage': 0.698,
            'plusMinus': -1.2
        },
        {
            'playerId': 1627783,
            'name': 'Pascal Siakam',
            'team': 'IND',
            'position': 'F',
            'gamesPlayed': 82,
            'minutesPerGame': 35.1,
            'points': 21.3,
            'assists': 3.7,
            'rebounds': 7.8,
            'steals': 0.9,
            'blocks': 0.3,
            'turnovers': 2.3,
            'fieldGoalPercentage': 0.473,
            'threePointPercentage': 0.388,
            'freeThrowPercentage': 0.788,
            'plusMinus': 2.4
        },
        {
            'playerId': 1629630,
            'name': 'Ja Morant',
            'team': 'MEM',
            'position': 'G',
            'gamesPlayed': 9,
            'minutesPerGame': 35.3,
            'points': 25.1,
            'assists': 8.1,
            'rebounds': 5.6,
            'steals': 0.9,
            'blocks': 0.3,
            'turnovers': 3.0,
            'fieldGoalPercentage': 0.473,
            'threePointPercentage': 0.278,
            'freeThrowPercentage': 0.813,
            'plusMinus': 2.8
        }
    ]
    return players

if __name__ == "__main__":
    # Get season from command line argument, default to unified profiles
    season = sys.argv[1] if len(sys.argv) > 1 else 'unified'
    
    if NBA_API_AVAILABLE:
        if season == 'unified':
            # Get unified player profiles with all seasons
            api_data = get_all_players_with_seasons()
            if api_data:
                print(json.dumps(api_data))
            else:
                # Fallback to curated data
                players_data = get_sample_nba_players()
                print(json.dumps(players_data))
        elif season == 'all-time':
            # Get all-time leaders (legacy format)
            api_data = get_all_time_leaders()
            if api_data:
                print(json.dumps(api_data))
            else:
                players_data = get_sample_nba_players()
                print(json.dumps(players_data))
        else:
            # Get specific season data (legacy format)
            api_data = get_nba_players_from_api(season)
            if api_data:
                print(json.dumps(api_data))
            else:
                players_data = get_sample_nba_players()
                print(json.dumps(players_data))
    else:
        # Use curated data when NBA API not available
        players_data = get_sample_nba_players()
        print(json.dumps(players_data))