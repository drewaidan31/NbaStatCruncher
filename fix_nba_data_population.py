#!/usr/bin/env python3

import os
import psycopg2
from nba_api.stats.endpoints import leagueleaders
import pandas as pd
import time

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)

def get_season_leaders(season):
    """Get top performers for a specific season"""
    try:
        print(f"Fetching leaders for {season}...")
        leaders = leagueleaders.LeagueLeaders(season=season, season_type_all_star='Regular Season')
        df = leaders.get_data_frames()[0]
        return df.head(75)  # Top 75 players per season for more data
    except Exception as e:
        print(f"Error fetching {season}: {e}")
        return pd.DataFrame()

def add_players_to_db(players_df, season, conn):
    """Add players from season to database"""
    cursor = conn.cursor()
    added_count = 0
    
    for _, player in players_df.iterrows():
        try:
            # Insert player data matching actual schema
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
                str(player.get('PLAYER', '')),
                str(player.get('TEAM_ABBREVIATION', '')),
                '',  # Position not in leaders data
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
                0.5,  # Default win percentage
                season
            ))
            added_count += 1
        except Exception as e:
            print(f"Error adding {player.get('PLAYER', 'Unknown')}: {e}")
            continue
    
    conn.commit()
    cursor.close()
    return added_count

def main():
    """Populate database with comprehensive NBA data"""
    
    # Define recent seasons first for faster results
    seasons = [
        '2023-24', '2022-23', '2021-22', '2020-21', '2019-20',
        '2018-19', '2017-18', '2016-17', '2015-16', '2014-15',
        '2013-14', '2012-13', '2011-12', '2010-11', '2009-10',
        '2008-09', '2007-08', '2006-07', '2005-06', '2004-05',
        '2003-04', '2002-03', '2001-02', '2000-01', '1999-00'
    ]
    
    conn = get_db_connection()
    total_added = 0
    
    print(f"Processing {len(seasons)} seasons to add ~1500-2000 player records...")
    
    for season in seasons:
        try:
            leaders_df = get_season_leaders(season)
            if not leaders_df.empty:
                added = add_players_to_db(leaders_df, season, conn)
                total_added += added
                print(f"  Added {added} players from {season} (Total: {total_added})")
            
            # Rate limiting to avoid API issues
            time.sleep(0.6)
            
        except Exception as e:
            print(f"Error processing {season}: {e}")
            continue
    
    conn.close()
    print(f"\nFinal total: {total_added} player records added!")
    print("Database now contains comprehensive NBA data for scatter plot analysis.")

if __name__ == "__main__":
    main()