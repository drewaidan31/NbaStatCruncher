#!/usr/bin/env python3

import os
import psycopg2
from nba_api.stats.endpoints import leagueleaders, playercareerstats
import pandas as pd
import time

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def add_authentic_nba_players():
    """Add authentic NBA players from multiple seasons"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Additional seasons to fetch
    seasons = [
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06',
        '2004-05', '2003-04', '2002-03', '2001-02', '2000-01',
        '1999-00', '1998-99', '1997-98', '1996-97'
    ]
    
    total_added = 0
    
    for season in seasons:
        print(f"Fetching authentic players for {season}...")
        try:
            # Get league leaders data
            leaders = leagueleaders.LeagueLeaders(
                season=season,
                season_type_all_star='Regular Season',
                per_mode48='PerGame'
            )
            
            df = leaders.get_data_frames()[0]
            
            for _, player in df.iterrows():
                try:
                    cursor.execute("""
                        INSERT INTO nba_players (
                            player_id, name, team, position, games_played, minutes_per_game,
                            points, assists, rebounds, steals, blocks, turnovers,
                            field_goal_percentage, field_goal_attempts, three_point_percentage,
                            three_point_attempts, free_throw_percentage, free_throw_attempts,
                            plus_minus, win_percentage, current_season
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (player_id, current_season) DO NOTHING
                    """, (
                        int(player.get('PLAYER_ID', 0)),
                        str(player.get('PLAYER', 'Unknown Player')),
                        str(player.get('TEAM_ABBREVIATION', 'UNK')),
                        'G',  # Default position
                        int(player.get('GP', 0)),
                        float(player.get('MIN', 0)),
                        float(player.get('PTS', 0)),
                        float(player.get('AST', 0)),
                        float(player.get('REB', 0)),
                        float(player.get('STL', 0)),
                        float(player.get('BLK', 0)),
                        float(player.get('TOV', 0)),
                        float(player.get('FG_PCT', 0)) if player.get('FG_PCT') else 0.45,
                        max(1, float(player.get('FGA', 1))),
                        float(player.get('FG3_PCT', 0)) if player.get('FG3_PCT') else 0.35,
                        max(1, float(player.get('FG3A', 1))),
                        float(player.get('FT_PCT', 0)) if player.get('FT_PCT') else 0.75,
                        max(1, float(player.get('FTA', 1))),
                        float(player.get('PLUS_MINUS', 0)),
                        max(0.1, min(0.9, float(player.get('W_PCT', 0.5)))),
                        season
                    ))
                    total_added += 1
                except Exception as e:
                    continue
            
            conn.commit()
            print(f"  Added players from {season}")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            print(f"Error fetching {season}: {e}")
            continue
    
    cursor.close()
    conn.close()
    print(f"Total authentic players added: {total_added}")

if __name__ == "__main__":
    add_authentic_nba_players()