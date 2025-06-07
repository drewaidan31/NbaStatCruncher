#!/usr/bin/env python3

import os
import psycopg2
from nba_api.stats.endpoints import leagueleaders
import pandas as pd
import time

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def fetch_historical_seasons():
    """Fetch data from multiple NBA seasons to reach 2000+ players"""
    seasons = [
        '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', 
        '2018-19', '2017-18', '2016-17', '2015-16', '2014-15',
        '2013-14', '2012-13', '2011-12', '2010-11', '2009-10',
        '2008-09', '2007-08', '2006-07', '2005-06', '2004-05'
    ]
    
    all_players = []
    
    for season in seasons:
        print(f"Fetching data for {season}...")
        try:
            # Get league leaders data for the season
            leaders = leagueleaders.LeagueLeaders(
                season=season,
                season_type_all_star='Regular Season'
            )
            
            df = leaders.get_data_frames()[0]
            
            # Add season information
            df['SEASON'] = season
            all_players.append(df)
            
            # Rate limiting to respect NBA API
            time.sleep(1)
            
        except Exception as e:
            print(f"Error fetching {season}: {e}")
            continue
    
    return pd.concat(all_players, ignore_index=True) if all_players else pd.DataFrame()

def insert_players_to_db(df, conn):
    """Insert player data into database"""
    cursor = conn.cursor()
    
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
                float(player.get('FG_PCT', 0)),
                float(player.get('FGA', 0)),
                float(player.get('FG3_PCT', 0)),
                float(player.get('FG3A', 0)),
                float(player.get('FT_PCT', 0)),
                float(player.get('FTA', 0)),
                float(player.get('PLUS_MINUS', 0)),
                float(player.get('W_PCT', 0)),
                str(player.get('SEASON', '2023-24'))
            ))
        except Exception as e:
            print(f"Error inserting player {player.get('PLAYER', 'Unknown')}: {e}")
            continue
    
    conn.commit()
    cursor.close()

def main():
    print("Expanding NBA dataset with historical seasons...")
    
    # Fetch historical data
    df = fetch_historical_seasons()
    
    if df.empty:
        print("No data fetched. Exiting.")
        return
    
    print(f"Fetched {len(df)} player records from NBA API")
    
    # Insert into database
    conn = get_db_connection()
    insert_players_to_db(df, conn)
    conn.close()
    
    print("Successfully expanded NBA dataset!")

if __name__ == "__main__":
    main()